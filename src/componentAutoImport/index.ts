import path from "node:path";

import {
	errorMessage,
	hasExtension,
	isPathInside,
	normalizeExtensions,
	normalizePath,
	relativeImportPath,
	resolvePathInside,
	scanFiles,
	writeFileIfChanged,
} from "../shared/fileSystem";
import { compareStrings, isValidIdentifier, toPascalCase } from "../shared/naming";
import { createDebouncedTask } from "../shared/plugin";

import type { ComponentNameContext, ComponentRegistryPluginOptions, ScannedComponent } from "./type";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";

const DEFAULT_EXTENSIONS = ["vue", "tsx", "jsx"] as const;

interface ResolvedOptions {
	conflict: NonNullable<ComponentRegistryPluginOptions["conflict"]>;
	debounce: number;
	deep: boolean;
	dirs: readonly string[];
	dts: false | string;
	extensions: ReadonlySet<string>;
	include: ComponentRegistryPluginOptions["include"];
	name: ComponentRegistryPluginOptions["name"];
	output: false | string;
}

/**
 * 扫描组件目录并执行名称、扩展名和冲突策略检查。
 *
 * @param root - Vite 项目根目录的绝对路径。
 * @param options - 目录、过滤、命名和冲突策略。
 * @param onWarning - `conflict: "warn"` 时接收诊断信息的回调。
 * @returns 按最终组件名称排序的组件描述。
 */
export async function scanComponents(
	root: string,
	options: ComponentRegistryPluginOptions = {},
	onWarning: (message: string) => void = () => undefined
): Promise<ScannedComponent[]> {
	const resolved = resolveOptions(options);
	const components = new Map<string, ScannedComponent>();
	const visitedFiles = new Set<string>();
	const generatedFiles = new Set(
		[resolved.output, resolved.dts]
			.filter((filePath): filePath is string => Boolean(filePath))
			.map((filePath) => resolvePathInside(root, filePath, "component-registry"))
	);

	for (const configuredDirectory of resolved.dirs) {
		const directory = path.resolve(root, configuredDirectory);
		const files = await scanFiles(directory, {
			deep: resolved.deep,
			filter: (filePath) => hasExtension(filePath, resolved.extensions) && !generatedFiles.has(path.resolve(filePath)),
		});

		for (const absolutePath of files) {
			if (visitedFiles.has(absolutePath)) continue;
			visitedFiles.add(absolutePath);
			const relativePath = normalizePath(path.relative(directory, absolutePath));
			const extension = path.extname(relativePath);
			const pathWithoutExtension = relativePath.slice(0, -extension.length);
			const basename = path.basename(pathWithoutExtension);
			const sourceName = basename.toLowerCase() === "index" ? path.basename(path.dirname(pathWithoutExtension)) : basename;
			const defaultName = toPascalCase(sourceName);
			const context: ComponentNameContext = { absolutePath, defaultName, relativePath };

			if (resolved.include && !resolved.include(context)) continue;

			const name = resolved.name?.(context) ?? defaultName;
			if (!isValidIdentifier(name)) {
				throw new Error(`[fast-vite:component-registry] 组件名称 ${JSON.stringify(name)} 不是合法的 JavaScript 标识符：${relativePath}`);
			}

			const component: ScannedComponent = { ...context, name };
			const previous = components.get(name);
			if (previous && resolved.conflict === "error") {
				throw new Error(`[fast-vite:component-registry] 组件名称冲突 ${JSON.stringify(name)}：${previous.absolutePath} 与 ${absolutePath}`);
			}
			if (previous && resolved.conflict === "warn") {
				onWarning(`[fast-vite:component-registry] 忽略重名组件 ${JSON.stringify(name)}：${absolutePath}；已使用 ${previous.absolutePath}`);
			}
			if (!previous || resolved.conflict === "overwrite") components.set(name, component);
		}
	}

	return [...components.values()].sort((left, right) => compareStrings(left.name, right.name));
}

/**
 * 生成组件导出、只读注册表与 `registerComponents` 辅助函数源码。
 *
 * @param outputFile - 生成文件的绝对路径，用于计算稳定的相对导入路径。
 * @param components - 通常由 {@link scanComponents} 返回的组件描述。
 * @returns 包含命名导出、只读注册表和批量注册函数的 TypeScript 源码。
 */
export function renderComponentRegistry(outputFile: string, components: readonly ScannedComponent[]): string {
	const lines = [
		"/* eslint-disable */",
		"/* prettier-ignore */",
		"// 此文件由 fast-vite-plugins 自动生成，请勿手动编辑。",
		'import type { App } from "vue";',
		"",
	];

	for (const component of components) {
		lines.push(`import ${component.name} from ${JSON.stringify(relativeImportPath(outputFile, component.absolutePath))};`);
	}

	if (components.length > 0) lines.push("");
	for (const component of components) lines.push(`export { ${component.name} };`);

	lines.push("", `export const components = { ${components.map((component) => component.name).join(", ")} } as const;`, "");
	lines.push("/** 将扫描到的组件注册为 Vue 全局组件。 */", "export function registerComponents(app: App): void {");
	for (const component of components) lines.push(`\tapp.component(${JSON.stringify(component.name)}, ${component.name});`);
	lines.push("}", "");
	return `${lines.join("\n")}\n`;
}

/**
 * 生成 Vue 模板类型检查可识别的 `GlobalComponents` 模块增强声明。
 *
 * @param dtsFile - 声明文件的绝对路径，用于计算组件类型导入路径。
 * @param components - 通常由 {@link scanComponents} 返回的组件描述。
 * @returns 可供 Vue 模板类型检查读取的模块增强声明源码。
 */
export function renderComponentDts(dtsFile: string, components: readonly ScannedComponent[]): string {
	const lines = [
		"/* eslint-disable */",
		"// 此文件由 fast-vite-plugins 自动生成，请勿手动编辑。",
		"export {};",
		"",
		'declare module "vue" {',
		"\texport interface GlobalComponents {",
	];
	for (const component of components) {
		const importPath = relativeImportPath(dtsFile, component.absolutePath);
		lines.push(`\t\t${component.name}: (typeof import(${JSON.stringify(importPath)}))["default"];`);
	}
	lines.push("\t}", "}", "");
	return `${lines.join("\n")}\n`;
}

/**
 * 扫描 Vue/TSX/JSX 组件，并生成可按需导入、批量注册的入口文件和全局组件类型。
 *
 * @param options - 扫描目录、输出文件、过滤、命名和冲突策略。
 * @returns 可直接加入 Vite `plugins` 的组件注册表生成插件。
 */
export function createComponentRegistryPlugin(options: ComponentRegistryPluginOptions = {}): Plugin {
	const resolved = resolveOptions(options);
	let config: ResolvedConfig;

	const generate = async (): Promise<void> => {
		const components = await scanComponents(config.root, options, (message) => config.logger.warn(message));
		if (resolved.output) {
			const outputFile = resolvePathInside(config.root, resolved.output, "component-registry");
			await writeFileIfChanged(outputFile, renderComponentRegistry(outputFile, components));
		}
		if (resolved.dts) {
			const dtsFile = resolvePathInside(config.root, resolved.dts, "component-registry");
			await writeFileIfChanged(dtsFile, renderComponentDts(dtsFile, components));
		}
	};

	return {
		name: "fast-vite:component-registry",
		enforce: "post",
		configResolved(resolvedConfig): void {
			config = resolvedConfig;
		},
		async buildStart(): Promise<void> {
			await generate();
		},
		configureServer(server: ViteDevServer): void {
			const directories = resolved.dirs.map((directory) => path.resolve(config.root, directory));
			const generatedFiles = [resolved.output, resolved.dts]
				.filter((filePath): filePath is string => Boolean(filePath))
				.map((filePath) => resolvePathInside(config.root, filePath, "component-registry"));
			server.watcher.add(directories);

			const schedule = createDebouncedTask(generate, resolved.debounce, (error) => {
				config.logger.error(`[fast-vite:component-registry] ${errorMessage(error)}`);
			});
			const handle = (_event: string, file: string): void => {
				if (generatedFiles.some((generatedFile) => path.resolve(file) === generatedFile)) return;
				if (!directories.some((directory) => isPathInside(directory, file))) return;
				if (hasExtension(file, resolved.extensions)) schedule();
			};

			server.watcher.on("all", handle);
			server.httpServer?.once("close", () => {
				server.watcher.off("all", handle);
				schedule.cancel();
			});
		},
	};
}

function resolveOptions(options: ComponentRegistryPluginOptions): ResolvedOptions {
	const dirs = options.dirs ?? "src/components";
	const resolvedDirs = typeof dirs === "string" ? [dirs] : dirs;
	const extensions = normalizeExtensions(options.extensions ?? DEFAULT_EXTENSIONS);
	if (resolvedDirs.length === 0) throw new Error("[fast-vite:component-registry] dirs 至少需要一个目录。");
	if (extensions.size === 0) throw new Error("[fast-vite:component-registry] extensions 至少需要一个扩展名。");
	if (options.output === false && options.dts === false) {
		throw new Error("[fast-vite:component-registry] output 与 dts 不能同时关闭。");
	}
	if (options.debounce !== undefined && (!Number.isFinite(options.debounce) || options.debounce < 0)) {
		throw new Error("[fast-vite:component-registry] debounce 必须是大于或等于 0 的有限数值。");
	}
	return {
		conflict: options.conflict ?? "error",
		debounce: options.debounce ?? 80,
		deep: options.deep ?? true,
		dirs: resolvedDirs,
		dts: options.dts ?? "types/components.generated.d.ts",
		extensions,
		include: options.include,
		name: options.name,
		output: options.output ?? "src/components/index.generated.ts",
	};
}

export type { ComponentNameContext, ComponentRegistryPluginOptions, ScannedComponent } from "./type";
