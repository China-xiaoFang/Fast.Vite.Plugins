import { readFile } from "node:fs/promises";
import path from "node:path";

import { errorMessage, isPathInside, normalizePath, resolvePathInside, scanFiles, writeFileIfChanged } from "../shared/fileSystem";
import { compareStrings, isValidIdentifier, toPascalCase } from "../shared/naming";
import { createDebouncedTask } from "../shared/plugin";

import type { ParsedSvg, ScannedSvgIcon, SvgAttributeValue, SvgIconNameContext, SvgIconsPluginOptions } from "./type";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";

interface ResolvedOptions {
	componentPrefix: string;
	componentSuffix: string;
	debounce: number;
	deep: boolean;
	defaultAttributes: Readonly<Record<string, SvgAttributeValue>>;
	dir: string;
	include: SvgIconsPluginOptions["include"];
	name: SvgIconsPluginOptions["name"];
	output: string;
	removeDimensions: boolean;
}

/**
 * 将完整 SVG 文本拆成根属性与内部标记。
 *
 * @param source - 包含单个完整 `<svg>...</svg>` 根元素的文本。
 * @returns 可用于生成 Vue 渲染函数的结构化结果。
 * @throws 输入缺少完整 SVG 根元素时抛出异常。
 */
export function parseSvg(source: string): ParsedSvg {
	const normalized = source
		.replace(/<\?xml[\s\S]*?\?>/gi, "")
		.replace(/<!doctype[\s\S]*?>/gi, "")
		.trim();
	const match = /<svg\b([^>]*)>([\s\S]*?)<\/svg\s*>/i.exec(normalized);
	if (!match) throw new Error("[fast-vite:svg-icons] SVG 文件必须包含完整的 <svg>...</svg> 根元素。");

	const attributes: Record<string, SvgAttributeValue> = {};
	const attributeSource = match[1] ?? "";
	const attributePattern = /([:@_a-z][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gi;
	for (const attribute of attributeSource.matchAll(attributePattern)) {
		const name = attribute[1];
		if (!name) continue;
		attributes[name] = attribute[2] ?? attribute[3] ?? attribute[4] ?? true;
	}

	if (!("xmlns" in attributes)) attributes.xmlns = "http://www.w3.org/2000/svg";
	if (!("viewBox" in attributes)) {
		const width = numericDimension(attributes.width);
		const height = numericDimension(attributes.height);
		if (width !== undefined && height !== undefined) attributes.viewBox = `0 0 ${width} ${height}`;
	}

	return { attributes, content: (match[2] ?? "").trim() };
}

/**
 * 以稳定顺序扫描并解析 SVG 文件，同时验证生成的组件名称。
 *
 * @param root - Vite 项目根目录的绝对路径。
 * @param options - 扫描目录、命名和根属性选项。
 * @returns 按最终组件名称排序的图标描述。
 */
export async function scanSvgIcons(root: string, options: SvgIconsPluginOptions = {}): Promise<ScannedSvgIcon[]> {
	const resolved = resolveOptions(options);
	const directory = path.resolve(root, resolved.dir);
	const files = await scanFiles(directory, {
		deep: resolved.deep,
		filter: (filePath) => path.extname(filePath).toLowerCase() === ".svg",
	});
	const icons = new Map<string, ScannedSvgIcon>();

	for (const absolutePath of files) {
		const relativePath = normalizePath(path.relative(directory, absolutePath));
		const relativeName = relativePath.slice(0, -path.extname(relativePath).length);
		const defaultName = `${resolved.componentPrefix}${toPascalCase(relativeName)}${resolved.componentSuffix}`;
		const context: SvgIconNameContext = { absolutePath, defaultName, relativePath };
		if (resolved.include && !resolved.include(context)) continue;

		const name = resolved.name?.(context) ?? defaultName;
		if (!isValidIdentifier(name)) throw new Error(`[fast-vite:svg-icons] 非法组件名 ${JSON.stringify(name)}：${relativePath}`);
		const previous = icons.get(name);
		if (previous) throw new Error(`[fast-vite:svg-icons] 图标组件名冲突 ${JSON.stringify(name)}：${previous.relativePath} 与 ${relativePath}`);

		const parsed = parseSvg(await readFile(absolutePath, "utf8"));
		const attributes = { ...resolved.defaultAttributes, ...parsed.attributes };
		if (resolved.removeDimensions) {
			delete attributes.width;
			delete attributes.height;
		}
		icons.set(name, { ...context, ...parsed, attributes, name });
	}

	return [...icons.values()].sort((left, right) => compareStrings(left.name, right.name));
}

/**
 * 将扫描结果渲染为单个 Vue 组件模块。
 *
 * 生成代码依赖消费项目中的 `vue`，不会要求 JSX 转换器。SVG 内部标记通过
 * `innerHTML` 写入，因此扫描目录只能包含受信任的仓库资源。
 *
 * @param icons - 已完成命名、解析并按名称排序的 SVG 图标。
 * @returns 可写入 TypeScript 文件的 Vue 图标模块源码。
 */
export function renderSvgIconModule(icons: readonly ScannedSvgIcon[]): string {
	const lines = [
		"/* eslint-disable */",
		"/* prettier-ignore */",
		"// 此文件由 fast-vite-plugins 自动生成，请勿手动编辑。",
		'import { defineComponent, h } from "vue";',
		"",
	];

	for (const icon of icons) {
		lines.push(`const ${icon.name}Attributes = ${JSON.stringify(icon.attributes)};`);
		lines.push(`const ${icon.name}Content = ${JSON.stringify(icon.content)};`);
		lines.push(`export const ${icon.name} = defineComponent({`);
		lines.push(`\tname: ${JSON.stringify(icon.name)},`);
		lines.push("\tinheritAttrs: false,");
		lines.push("\tsetup(_props, { attrs }) {");
		lines.push(`\t\treturn () => h("svg", { ...${icon.name}Attributes, ...attrs, innerHTML: ${icon.name}Content });`);
		lines.push("\t},");
		lines.push("});", "");
	}

	lines.push(`export const icons = { ${icons.map((icon) => icon.name).join(", ")} } as const;`);
	lines.push("export default icons;", "");
	return `${lines.join("\n")}\n`;
}

/**
 * 将 SVG 目录编译为一个类型安全的 Vue 图标组件模块。
 *
 * 生成组件通过 `h("svg")` 直接渲染 SVG，不要求消费项目安装 JSX 插件。
 *
 * @param options - SVG 目录、输出文件、命名、过滤和根属性配置。
 * @returns 可直接加入 Vite `plugins` 的 SVG 图标生成插件。
 */
export function createSvgIconsPlugin(options: SvgIconsPluginOptions = {}): Plugin {
	const resolved = resolveOptions(options);
	let config: ResolvedConfig;

	const generate = async (): Promise<void> => {
		const icons = await scanSvgIcons(config.root, options);
		await writeFileIfChanged(resolvePathInside(config.root, resolved.output, "svg-icons"), renderSvgIconModule(icons));
	};

	return {
		name: "fast-vite:svg-icons",
		enforce: "post",
		configResolved(resolvedConfig): void {
			config = resolvedConfig;
		},
		async buildStart(): Promise<void> {
			await generate();
		},
		configureServer(server: ViteDevServer): void {
			const directory = path.resolve(config.root, resolved.dir);
			const outputFile = resolvePathInside(config.root, resolved.output, "svg-icons");
			server.watcher.add(directory);

			const schedule = createDebouncedTask(generate, resolved.debounce, (error) => {
				config.logger.error(`[fast-vite:svg-icons] ${errorMessage(error)}`);
			});
			const handle = (_event: string, file: string): void => {
				if (path.resolve(file) === outputFile || !isPathInside(directory, file)) return;
				if (path.extname(file).toLowerCase() === ".svg") schedule();
			};

			server.watcher.on("all", handle);
			server.httpServer?.once("close", () => {
				server.watcher.off("all", handle);
				schedule.cancel();
			});
		},
	};
}

function numericDimension(value: SvgAttributeValue | undefined): number | undefined {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value !== "string") return undefined;
	const match = /^([\d.]+)(?:px)?$/i.exec(value.trim());
	if (!match?.[1]) return undefined;
	const parsed = Number(match[1]);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveOptions(options: SvgIconsPluginOptions): ResolvedOptions {
	if (options.debounce !== undefined && (!Number.isFinite(options.debounce) || options.debounce < 0)) {
		throw new Error("[fast-vite:svg-icons] debounce 必须是大于或等于 0 的有限数值。");
	}
	return {
		componentPrefix: options.componentPrefix ?? "",
		componentSuffix: options.componentSuffix ?? "Icon",
		debounce: options.debounce ?? 80,
		deep: options.deep ?? true,
		defaultAttributes: options.defaultAttributes ?? {},
		dir: options.dir ?? "src/assets/icons",
		include: options.include,
		name: options.name,
		output: options.output ?? "src/icons/index.generated.ts",
		removeDimensions: options.removeDimensions ?? false,
	};
}

export type { ParsedSvg, ScannedSvgIcon, SvgAttributeValue, SvgIconNameContext, SvgIconsPluginOptions } from "./type";
