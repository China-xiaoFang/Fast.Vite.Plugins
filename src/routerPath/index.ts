import { readFile } from "node:fs/promises";
import path from "node:path";

import {
	errorMessage,
	hasExtension,
	isPathInside,
	normalizeExtensions,
	normalizePath,
	resolvePathInside,
	scanFiles,
	writeFileIfChanged,
} from "../shared/fileSystem";
import { compareStrings, toPascalCase } from "../shared/naming";
import { createDebouncedTask } from "../shared/plugin";

import type { RouterMetaContext, RouterMetaMap, RouterMetaPluginOptions } from "./type";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";

const DEFAULT_EXTENSIONS = ["vue", "tsx", "jsx"] as const;

interface ResolvedOptions {
	debounce: number;
	deep: boolean;
	dir: string;
	extensions: ReadonlySet<string>;
	include: RouterMetaPluginOptions["include"];
	indent: number;
	key: RouterMetaPluginOptions["key"];
	name: RouterMetaPluginOptions["name"];
	output: string;
}

/**
 * 从 Vue `<script setup>` 的 `defineOptions({ name: "..." })` 中提取组件名。
 * 这里只处理静态字符串；动态表达式会回退到文件名，保证结果可预测。
 *
 * @param source - Vue 或 TypeScript 页面源码。
 * @returns 静态名称；未找到可确定名称时返回 `undefined`。
 */
export function extractComponentName(source: string): string | undefined {
	const match = /defineOptions(?:\s*<[^>]*>)?\s*\(\s*\{[\s\S]*?\bname\s*:\s*(["'`])([^"'`]+)\1/.exec(source);
	return match?.[2];
}

/**
 * 扫描页面文件并生成稳定排序的“文件路径 -> 组件名称”映射。
 *
 * @param root - Vite 项目根目录的绝对路径。
 * @param options - 页面目录、过滤、命名和输出键规则。
 * @returns 按路径键稳定排序的页面名称映射。
 */
export async function generateRouterMeta(root: string, options: RouterMetaPluginOptions = {}): Promise<RouterMetaMap> {
	const resolved = resolveOptions(options);
	const directory = path.resolve(root, resolved.dir);
	const outputFile = resolvePathInside(root, resolved.output, "router-meta");
	const files = await scanFiles(directory, {
		deep: resolved.deep,
		filter: (filePath) => path.resolve(filePath) !== outputFile && hasExtension(filePath, resolved.extensions),
	});
	const records: [string, string][] = [];
	const keys = new Set<string>();

	for (const absolutePath of files) {
		const source = await readFile(absolutePath, "utf8");
		const relativePath = normalizePath(path.relative(root, absolutePath));
		const basename = path.basename(absolutePath, path.extname(absolutePath));
		const defaultName = toPascalCase(basename.toLowerCase() === "index" ? path.basename(path.dirname(absolutePath)) : basename);
		const extractedName = extractComponentName(source);
		const context: RouterMetaContext = { absolutePath, defaultName, extractedName, relativePath };

		if (resolved.include && !resolved.include(context)) continue;
		const key = resolved.key?.(context) ?? `/${relativePath}`;
		const name = resolved.name?.(context) ?? extractedName ?? defaultName;
		if (!key) throw new Error(`[fast-vite:router-meta] ${relativePath} 生成了空路径键。`);
		if (!name) throw new Error(`[fast-vite:router-meta] ${relativePath} 生成了空组件名。`);
		if (keys.has(key)) throw new Error(`[fast-vite:router-meta] 路径键冲突：${key}`);
		keys.add(key);
		records.push([key, name]);
	}

	return Object.fromEntries(records.sort(([left], [right]) => compareStrings(left, right)));
}

/**
 * 为路由缓存、KeepAlive 或权限配置生成页面文件路径与稳定组件名的 JSON 映射。
 *
 * @param options - 页面扫描、命名、路径键、JSON 输出和监听配置。
 * @returns 可直接加入 Vite `plugins` 的路由元数据生成插件。
 */
export function createRouterMetaPlugin(options: RouterMetaPluginOptions = {}): Plugin {
	const resolved = resolveOptions(options);
	let config: ResolvedConfig;

	const generate = async (): Promise<void> => {
		const map = await generateRouterMeta(config.root, options);
		const outputFile = resolvePathInside(config.root, resolved.output, "router-meta");
		await writeFileIfChanged(outputFile, `${JSON.stringify(map, null, resolved.indent)}\n`);
	};

	return {
		name: "fast-vite:router-meta",
		enforce: "post",
		configResolved(resolvedConfig): void {
			config = resolvedConfig;
		},
		async buildStart(): Promise<void> {
			await generate();
		},
		configureServer(server: ViteDevServer): void {
			const directory = path.resolve(config.root, resolved.dir);
			const outputFile = resolvePathInside(config.root, resolved.output, "router-meta");
			server.watcher.add(directory);

			const schedule = createDebouncedTask(generate, resolved.debounce, (error) => {
				config.logger.error(`[fast-vite:router-meta] ${errorMessage(error)}`);
			});
			const handle = (_event: string, file: string): void => {
				if (path.resolve(file) === outputFile || !isPathInside(directory, file)) return;
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

function resolveOptions(options: RouterMetaPluginOptions): ResolvedOptions {
	const extensions = normalizeExtensions(options.extensions ?? DEFAULT_EXTENSIONS);
	if (extensions.size === 0) throw new Error("[fast-vite:router-meta] extensions 至少需要一个扩展名。");
	if (options.indent !== undefined && (!Number.isInteger(options.indent) || options.indent < 0 || options.indent > 10)) {
		throw new Error("[fast-vite:router-meta] indent 必须是 0 到 10 之间的整数。");
	}
	if (options.debounce !== undefined && (!Number.isFinite(options.debounce) || options.debounce < 0)) {
		throw new Error("[fast-vite:router-meta] debounce 必须是大于或等于 0 的有限数值。");
	}
	return {
		debounce: options.debounce ?? 80,
		deep: options.deep ?? true,
		dir: options.dir ?? "src/views",
		extensions,
		include: options.include,
		indent: options.indent ?? 2,
		key: options.key,
		name: options.name,
		output: options.output ?? "src/router/routes.generated.json",
	};
}

export type { RouterMetaContext, RouterMetaMap, RouterMetaPluginOptions } from "./type";
