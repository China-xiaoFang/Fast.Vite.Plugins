import { readFile } from "node:fs/promises";
import path from "node:path";

import { isValidIdentifier } from "../shared/naming";

import type { CdnImportPluginOptions, CdnModule, CdnModuleResolver, CdnModuleResolverContext, ResolvedCdnModule } from "./type";
import type { ConfigEnv, HtmlTagDescriptor, Plugin, ResolvedConfig } from "vite";

/** jsDelivr 的 npm 文件 URL 模板，可传给 `CdnImportPluginOptions.urlTemplate`。 */
export const cdnJsDelivrUrl = "https://cdn.jsdelivr.net/npm/{name}@{version}/{path}";
/** unpkg 的 npm 文件 URL 模板，可传给 `CdnImportPluginOptions.urlTemplate`。 */
export const cdnUnpkgUrl = "https://unpkg.com/{name}@{version}/{path}";

interface AstNode {
	type: string;
	start: number;
	end: number;
	[key: string]: unknown;
}

interface AstProgram {
	body: AstNode[];
}

interface Replacement {
	start: number;
	end: number;
	content: string;
}

/**
 * 使用模块名、版本和文件路径渲染 CDN URL。
 *
 * `http(s)`、协议相对、`data:` 与 `blob:` URL 会原样返回。
 *
 * @param template - 包含 `{name}`、`{version}` 与 `{path}` 占位符的 URL 模板。
 * @param data - 当前包名、版本和资源路径。
 * @returns 渲染后的完整 URL，或原样保留的绝对资源 URL。
 * @throws 模板需要 `{version}` 但没有可用版本时抛出异常。
 */
export function renderCdnUrl(template: string, data: { name: string; path: string; version: string }): string {
	if (/^(?:https?:)?\/\//i.test(data.path) || /^(?:data|blob):/i.test(data.path)) return data.path;
	if (!data.version && template.includes("{version}")) {
		throw new Error(`[fast-vite:cdn-import] 无法确定 ${data.name} 的版本；请显式配置 version。`);
	}
	return template.replaceAll("{name}", data.name).replaceAll("{version}", data.version).replaceAll("{path}", data.path.replace(/^\//, ""));
}

/**
 * 将 `Vue` 或 `ReactDOM.client` 转换为不依赖局部变量的 `globalThis` 访问表达式。
 *
 * @param globalName - 以点号分隔的浏览器全局变量路径。
 * @returns 仅包含安全属性访问的 `globalThis` 表达式。
 * @throws 任一名称片段不是合法 ECMAScript 标识符时抛出异常。
 */
export function globalExpression(globalName: string): string {
	const parts = globalName.split(".");
	if (parts.some((part) => !isValidIdentifier(part))) {
		throw new Error(`[fast-vite:cdn-import] 非法浏览器全局变量：${globalName}`);
	}
	return parts.reduce((expression, part) => `${expression}[${JSON.stringify(part)}]`, "globalThis");
}

/**
 * 根据 Vite/Rollup 已解析的 ESTree，把 import 与 re-export 转换为浏览器全局变量访问。
 * 直接使用语法树边界，不会误改注释、字符串或业务代码，也不引入运行时解析依赖。
 *
 * @param code - Vite 当前转换钩子收到的模块源码。
 * @param externals - 模块名到浏览器全局变量路径的映射。
 * @param parsedProgram - 由 Vite 插件上下文解析的 ESTree Program。
 * @returns 有替换时返回源码和空 sourcemap，否则返回 `undefined`。
 */
export function transformCdnImports(
	code: string,
	externals: Readonly<Record<string, string>>,
	parsedProgram: unknown
): { code: string; map: null } | undefined {
	const program = parsedProgram as AstProgram;
	if (!Array.isArray(program?.body)) return undefined;

	const replacements: Replacement[] = [];
	let exportIndex = 0;
	for (const node of program.body) {
		const moduleName = sourceValue(node.source);
		if (!moduleName || !(moduleName in externals)) continue;
		const expression = globalExpression(externals[moduleName] ?? "");

		if (node.type === "ImportDeclaration") {
			replacements.push({ ...nodeRange(node), content: renderImportDeclaration(node, expression) });
			continue;
		}
		if (node.type === "ExportNamedDeclaration") {
			replacements.push({ ...nodeRange(node), content: renderNamedExport(node, expression, exportIndex) });
			exportIndex += 1;
			continue;
		}
		if (node.type === "ExportAllDeclaration") {
			replacements.push({ ...nodeRange(node), content: renderExportAll(node, expression) });
		}
	}

	visitAst(program, (node) => {
		if (node.type !== "ImportExpression") return;
		const moduleName = sourceValue(node.source);
		if (!moduleName || !(moduleName in externals)) return;
		replacements.push({ ...nodeRange(node), content: `Promise.resolve(${globalExpression(externals[moduleName] ?? "")})` });
	});

	if (replacements.length === 0) return undefined;
	return { code: applyReplacements(code, replacements), map: null };
}

/**
 * 解析 CDN 模块、自动读取版本并生成最终资源 URL。
 *
 * @param root - Vite 项目根目录的绝对路径。
 * @param options - CDN 模块、URL 模板和标签行为配置。
 * @param env - 当前 Vite 命令和模式。
 * @returns 按配置顺序补全版本、CSS URL 和 JavaScript URL 的模块列表。
 */
export async function resolveCdnModules(root: string, options: CdnImportPluginOptions, env: ConfigEnv): Promise<ResolvedCdnModule[]> {
	const urlTemplate = options.urlTemplate ?? cdnJsDelivrUrl;
	const configured = (Array.isArray(options.modules) ? options.modules : [options.modules]) as readonly (CdnModule | CdnModuleResolver)[];
	if (configured.length === 0) throw new Error("[fast-vite:cdn-import] modules 至少需要一个模块。");
	const context: CdnModuleResolverContext = { ...env, root, urlTemplate };
	const resolved: ResolvedCdnModule[] = [];

	for (const item of configured) {
		const module = typeof item === "function" ? await item(context) : item;
		validateModule(module);
		const version = module.version ?? (options.resolveVersion === false ? "" : await findPackageVersion(root, module.name));
		const template = module.urlTemplate ?? urlTemplate;
		const render = (resourcePath: string): string => renderCdnUrl(template, { name: module.name, path: resourcePath, version });
		resolved.push({
			...module,
			cssUrls: toArray(module.css).map(render),
			jsUrls: toArray(module.js).map(render),
			version,
		});
	}

	return resolved;
}

/**
 * 将指定依赖替换为 CDN 全局变量，并按依赖顺序向 HTML 注入 CSS 与 JavaScript。
 *
 * @param options - CDN 模块、版本解析、开发模式、SSR 与标签配置。
 * @returns 可直接加入 Vite `plugins` 的 CDN 导入插件。
 */
export function createCdnImportPlugin(options: CdnImportPluginOptions): Plugin {
	let config: ResolvedConfig;
	let env: ConfigEnv;
	let modules: ResolvedCdnModule[] = [];
	let externalMap: Record<string, string> = {};

	return {
		name: "fast-vite:cdn-import",
		enforce: "post",
		config(_config, configEnv): void {
			env = configEnv;
		},
		async configResolved(resolvedConfig): Promise<void> {
			config = resolvedConfig;
			modules = await resolveCdnModules(config.root, options, env);
			externalMap = createExternalMap(modules);
		},
		transform(code, _id, transformOptions): { code: string; map: null } | undefined {
			if (transformOptions?.ssr && options.ssr !== true) return undefined;
			if (config.command === "serve" && options.dev !== true) return undefined;
			return transformCdnImports(code, externalMap, this.parse(code));
		},
		transformIndexHtml(): HtmlTagDescriptor[] {
			if (config.command === "serve" && options.dev !== true) return [];

			const tags: HtmlTagDescriptor[] = [];
			const injectTo = options.injectTo ?? "head-prepend";
			for (const module of modules) {
				for (const url of module.cssUrls) {
					const custom = options.generateStyleTag?.(module, url) ?? {};
					const { attrs: customAttributes, ...customDescriptor } = custom;
					tags.push({
						tag: "link",
						injectTo,
						...customDescriptor,
						attrs: {
							href: url,
							rel: "stylesheet",
							...(options.crossorigin === false ? {} : { crossorigin: options.crossorigin ?? "anonymous" }),
							...module.styleAttributes,
							...customAttributes,
						},
					});
				}

				for (const url of module.jsUrls) {
					const custom = options.generateScriptTag?.(module, url) ?? {};
					const { attrs: customAttributes, ...customDescriptor } = custom;
					tags.push({
						tag: "script",
						injectTo,
						...customDescriptor,
						attrs: {
							src: url,
							...(options.crossorigin === false ? {} : { crossorigin: options.crossorigin ?? "anonymous" }),
							...module.scriptAttributes,
							...customAttributes,
						},
					});
				}
			}
			return tags;
		},
	};
}

function renderImportDeclaration(node: AstNode, expression: string): string {
	if (node.importKind === "type") return "";
	const specifiers = Array.isArray(node.specifiers) ? (node.specifiers as AstNode[]) : [];
	if (specifiers.length === 0) return `void ${expression};`;

	const declarations: string[] = [];
	for (const specifier of specifiers) {
		if (specifier.importKind === "type") continue;
		const localName = identifierName(specifier.local);
		if (!localName) continue;
		if (specifier.type === "ImportDefaultSpecifier" || specifier.type === "ImportNamespaceSpecifier") {
			declarations.push(`const ${localName} = ${expression};`);
			continue;
		}
		const importedName = identifierName(specifier.imported);
		if (importedName) declarations.push(`const ${localName} = ${propertyAccess(expression, importedName)};`);
	}
	return declarations.join("\n");
}

function renderNamedExport(node: AstNode, expression: string, exportIndex: number): string {
	if (node.exportKind === "type") return "";
	const specifiers = Array.isArray(node.specifiers) ? (node.specifiers as AstNode[]) : [];
	const declarations: string[] = [];
	const exports: string[] = [];
	for (const [index, specifier] of specifiers.entries()) {
		if (specifier.exportKind === "type") continue;
		const importedName = identifierName(specifier.local);
		const exportedName = identifierName(specifier.exported);
		if (!importedName || !exportedName) continue;
		const localName = `__fast_cdn_export_${exportIndex}_${index}`;
		declarations.push(`const ${localName} = ${propertyAccess(expression, importedName)};`);
		exports.push(`${localName} as ${exportedName}`);
	}
	return exports.length === 0 ? "" : `${declarations.join("\n")}\nexport { ${exports.join(", ")} };`;
}

function renderExportAll(node: AstNode, expression: string): string {
	const exportedName = identifierName(node.exported);
	if (!exportedName) throw new Error("[fast-vite:cdn-import] 无法将 export * 映射到全局变量；请改为显式命名导出。");
	return `const ${exportedName} = ${expression};\nexport { ${exportedName} };`;
}

function propertyAccess(expression: string, name: string): string {
	return name === "default" ? expression : `${expression}[${JSON.stringify(name)}]`;
}

function identifierName(value: unknown): string | undefined {
	if (!value || typeof value !== "object") return undefined;
	const record = value as { name?: unknown; value?: unknown };
	if (typeof record.name === "string") return record.name;
	return typeof record.value === "string" ? record.value : undefined;
}

function sourceValue(value: unknown): string | undefined {
	if (!value || typeof value !== "object") return undefined;
	const source = value as { value?: unknown };
	return typeof source.value === "string" ? source.value : undefined;
}

function nodeRange(node: AstNode): Pick<Replacement, "end" | "start"> {
	return { end: node.end, start: node.start };
}

function applyReplacements(code: string, replacements: Replacement[]): string {
	let transformed = code;
	let previousStart = Number.POSITIVE_INFINITY;
	for (const replacement of replacements.sort((left, right) => right.start - left.start)) {
		if (replacement.end > previousStart) continue;
		transformed = `${transformed.slice(0, replacement.start)}${replacement.content}${transformed.slice(replacement.end)}`;
		previousStart = replacement.start;
	}
	return transformed;
}

function visitAst(value: unknown, visitor: (node: AstNode) => void): void {
	if (Array.isArray(value)) {
		for (const item of value) visitAst(item, visitor);
		return;
	}
	if (!value || typeof value !== "object") return;
	const record = value as Record<string, unknown>;
	if (typeof record.type === "string" && typeof record.start === "number" && typeof record.end === "number") {
		visitor(record as AstNode);
	}
	for (const [key, child] of Object.entries(record)) {
		if (key !== "parent") visitAst(child, visitor);
	}
}

async function findPackageVersion(root: string, packageName: string): Promise<string> {
	let directory = path.resolve(root);
	while (true) {
		const packageFile = path.join(directory, "node_modules", packageName, "package.json");
		try {
			const parsed = JSON.parse(await readFile(packageFile, "utf8")) as { version?: unknown };
			if (typeof parsed.version === "string") return parsed.version;
		} catch (error) {
			if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
		}

		const parent = path.dirname(directory);
		if (parent === directory) return "";
		directory = parent;
	}
}

function toArray(value: string | readonly string[] | undefined): readonly string[] {
	if (!value) return [];
	return typeof value === "string" ? [value] : value;
}

function validateModule(module: CdnModule): void {
	if (!module.name) throw new Error("[fast-vite:cdn-import] 模块 name 不能为空。");
	if (!module.global) throw new Error(`[fast-vite:cdn-import] ${module.name} 的 global 不能为空。`);
	if (toArray(module.js).length === 0) throw new Error(`[fast-vite:cdn-import] ${module.name} 至少需要一个 JavaScript 文件。`);
	globalExpression(module.global);
}

function createExternalMap(modules: readonly ResolvedCdnModule[]): Record<string, string> {
	const result: Record<string, string> = {};
	for (const module of modules) {
		for (const name of [module.name, ...(module.aliases ?? [])]) {
			if (name in result) throw new Error(`[fast-vite:cdn-import] 模块名或别名重复：${name}`);
			result[name] = module.global;
		}
	}
	return result;
}

export type { CdnImportPluginOptions, CdnModule, CdnModuleResolver, CdnModuleResolverContext, CdnTagAttributes, ResolvedCdnModule } from "./type";
