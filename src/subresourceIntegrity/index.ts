import { createHash } from "node:crypto";
import path from "node:path";

import { isSafeOutputFileName, normalizePath } from "../shared/fileSystem";
import { compareStrings } from "../shared/naming";

import type {
	InjectSubresourceIntegrityOptions,
	SubresourceIntegrityAlgorithm,
	SubresourceIntegrityFilter,
	SubresourceIntegrityInjectionResult,
	SubresourceIntegrityPluginOptions,
} from "./type";
import type { Plugin, ResolvedConfig } from "vite";

const DEFAULT_FILTER = /\.(?:css|m?js)$/i;
const HTML_TAG_PATTERN = /<(?:link|script)\b[^>]*>/gi;
const SUPPORTED_ALGORITHMS = new Set<SubresourceIntegrityAlgorithm>(["sha256", "sha384", "sha512"]);

/**
 * 为内容生成符合浏览器 SRI 语法的一个或多个摘要。
 *
 * @param content - 最终写入构建产物的字节或 UTF-8 字符串。
 * @param algorithms - 摘要算法；重复项会删除但保留首次出现顺序。
 * @returns 以空格连接、可直接写入 HTML `integrity` 属性的摘要。
 */
export function createSubresourceIntegrity(
	content: string | Uint8Array,
	algorithms: SubresourceIntegrityAlgorithm | readonly SubresourceIntegrityAlgorithm[] = "sha384"
): string {
	const values = normalizeAlgorithms(algorithms);
	const bytes = typeof content === "string" ? Buffer.from(content) : content;
	return values.map((algorithm) => `${algorithm}-${createHash(algorithm).update(bytes).digest("base64")}`).join(" ");
}

/**
 * 给 HTML 中指向本次构建产物的 script、stylesheet 和 modulepreload 标签注入 SRI。
 *
 * 完整 URL 仅在与 Vite 绝对 `base` 同源且位于其路径下时视为本地产物；其他远程 URL、
 * `data:`、`blob:` 与页面锚点保持不变。函数不依赖 DOM，可在 Node.js 构建阶段复用。
 *
 * @param html - 构建后的 HTML 源码。
 * @param options - HTML 文件位置、Vite base、摘要映射和属性覆盖策略。
 * @returns 转换后的 HTML、成功注入文件和缺失本地资源列表。
 */
export function injectSubresourceIntegrity(html: string, options: InjectSubresourceIntegrityOptions): SubresourceIntegrityInjectionResult {
	const injected = new Set<string>();
	const missing = new Set<string>();
	const htmlFileName = normalizePath(options.htmlFileName ?? "index.html");
	const base = options.base ?? "/";
	const crossorigin = options.crossorigin ?? "anonymous";
	const overwrite = options.overwrite ?? true;

	const transformed = html.replace(HTML_TAG_PATTERN, (tag) => {
		const resourceUrl = eligibleResourceUrl(tag);
		if (!resourceUrl) return tag;
		const fileName = resolveHtmlResource(resourceUrl, htmlFileName, base);
		if (fileName === undefined) return tag;
		const integrity = options.integrities[fileName];
		if (!integrity) {
			missing.add(resourceUrl);
			return tag;
		}
		if (!overwrite && hasAttribute(tag, "integrity")) return tag;

		let nextTag = setAttribute(tag, "integrity", integrity);
		if (crossorigin !== false) nextTag = setAttribute(nextTag, "crossorigin", crossorigin);
		injected.add(fileName);
		return nextTag;
	});

	return {
		html: transformed,
		injected: [...injected].sort(compareStrings),
		missing: [...missing].sort(compareStrings),
	};
}

/**
 * 为 Vite 最终 JavaScript/CSS 产物生成 SRI，并更新构建后的 HTML 入口。
 *
 * 插件在输出阶段末尾运行；若同时使用预压缩插件，应把本插件放在压缩插件之前，使
 * `.gz` / `.br` HTML 与注入后的原文件保持一致。
 *
 * @param options - 摘要算法、资源过滤、CORS、覆盖、清单和严格模式配置。
 * @returns 可直接加入 Vite `plugins` 的 Subresource Integrity 插件。
 */
export function createSubresourceIntegrityPlugin(options: SubresourceIntegrityPluginOptions = {}): Plugin {
	const algorithms = normalizeAlgorithms(options.algorithms ?? "sha384");
	const filter = options.filter ?? DEFAULT_FILTER;
	const manifestFileName = resolveManifestFileName(options.manifest);
	let config: ResolvedConfig;

	return {
		name: "fast-vite:subresource-integrity",
		apply: "build",
		enforce: "post",
		configResolved(resolvedConfig): void {
			config = resolvedConfig;
		},
		generateBundle: {
			order: "post",
			handler(_outputOptions, bundle): void {
				const integrities: Record<string, string> = {};
				for (const output of Object.values(bundle).sort((left, right) => compareStrings(left.fileName, right.fileName))) {
					if (!matchesFilter(output.fileName, output.type, filter)) continue;
					const content = output.type === "chunk" ? output.code : output.source;
					integrities[output.fileName] = createSubresourceIntegrity(content, algorithms);
				}

				const missing = new Set<string>();
				for (const output of Object.values(bundle)) {
					if (output.type !== "asset" || !/\.html?$/i.test(output.fileName)) continue;
					const source = typeof output.source === "string" ? output.source : Buffer.from(output.source).toString("utf8");
					const result = injectSubresourceIntegrity(source, {
						htmlFileName: output.fileName,
						base: config.base,
						integrities,
						crossorigin: options.crossorigin,
						overwrite: options.overwrite,
					});
					output.source = result.html;
					for (const resource of result.missing) missing.add(`${output.fileName}: ${resource}`);
				}

				if (options.strict && missing.size > 0) {
					this.error(
						`[fast-vite:subresource-integrity] 以下本地 HTML 资源不在构建产物中：\n${[...missing]
							.sort(compareStrings)
							.map((item) => `- ${item}`)
							.join("\n")}`
					);
				}

				if (manifestFileName) {
					if (Object.hasOwn(bundle, manifestFileName)) {
						this.error(`[fast-vite:subresource-integrity] 完整性清单与现有产物冲突：${manifestFileName}`);
					}
					this.emitFile({ type: "asset", fileName: manifestFileName, source: `${JSON.stringify(integrities, null, 2)}\n` });
				}
			},
		},
	};
}

function normalizeAlgorithms(configured: SubresourceIntegrityAlgorithm | readonly SubresourceIntegrityAlgorithm[]): SubresourceIntegrityAlgorithm[] {
	const algorithms = [...new Set(typeof configured === "string" ? [configured] : configured)];
	if (algorithms.length === 0 || algorithms.some((algorithm) => !SUPPORTED_ALGORITHMS.has(algorithm))) {
		throw new Error("[fast-vite:subresource-integrity] algorithms 只能包含 sha256、sha384 或 sha512，且不能为空。");
	}
	return algorithms;
}

function matchesFilter(fileName: string, type: "asset" | "chunk", filter: SubresourceIntegrityFilter): boolean {
	if (typeof filter === "function") return filter(fileName, type);
	filter.lastIndex = 0;
	return filter.test(fileName);
}

function eligibleResourceUrl(tag: string): string | undefined {
	const tagName = /^<\s*(link|script)\b/i.exec(tag)?.[1]?.toLowerCase();
	if (tagName === "script") return readAttribute(tag, "src");
	if (tagName !== "link") return undefined;

	const rel = readAttribute(tag, "rel")?.toLowerCase().split(/\s+/) ?? [];
	if (rel.includes("stylesheet") || rel.includes("modulepreload")) return readAttribute(tag, "href");
	if (rel.includes("preload")) {
		const as = readAttribute(tag, "as")?.toLowerCase();
		if (as === "script" || as === "style") return readAttribute(tag, "href");
	}
	return undefined;
}

function resolveHtmlResource(resourceUrl: string, htmlFileName: string, base: string): string | undefined {
	const withoutSuffix = resourceUrl.split(/[?#]/, 1)[0] ?? "";
	if (!withoutSuffix || withoutSuffix.startsWith("#") || /^(?:blob|data):/i.test(withoutSuffix)) return undefined;

	let resourcePath = withoutSuffix;
	const absoluteBase = parseHttpUrl(base);
	const absoluteResource = parseHttpUrl(resourcePath.startsWith("//") && absoluteBase ? `${absoluteBase.protocol}${resourcePath}` : resourcePath);
	if (absoluteResource) {
		if (absoluteBase?.origin !== absoluteResource.origin) return undefined;
		resourcePath = absoluteResource.pathname;
	} else if (/^[a-z][\w+.-]*:/i.test(resourcePath) || resourcePath.startsWith("//")) {
		return undefined;
	}

	let candidate: string;
	if (resourcePath.startsWith("/")) {
		const basePath = absoluteBase?.pathname ?? (base.startsWith("/") ? base : "/");
		candidate = resourcePath.startsWith(basePath) ? resourcePath.slice(basePath.length) : resourcePath.slice(1);
	} else {
		candidate = path.posix.join(path.posix.dirname(htmlFileName), resourcePath);
	}

	try {
		candidate = decodeURIComponent(candidate);
	} catch {
		return undefined;
	}
	const normalized = path.posix.normalize(candidate).replace(/^\.\//, "");
	return normalized.startsWith("../") ? undefined : normalized;
}

function readAttribute(tag: string, name: string): string | undefined {
	const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
	return match?.[1] ?? match?.[2] ?? match?.[3];
}

function hasAttribute(tag: string, name: string): boolean {
	return new RegExp(`\\s${name}(?:\\s|=|/?>)`, "i").test(tag);
}

function setAttribute(tag: string, name: string, value: string): string {
	const attributePattern = new RegExp(`\\s${name}(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+))?`, "i");
	const attribute = ` ${name}="${value}"`;
	return attributePattern.test(tag) ? tag.replace(attributePattern, attribute) : tag.replace(/\s*\/?>$/, (ending) => `${attribute}${ending}`);
}

function resolveManifestFileName(manifest: boolean | string | undefined): string | undefined {
	if (!manifest) return undefined;
	const fileName = manifest === true ? "integrity-manifest.json" : normalizePath(manifest);
	if (!isSafeOutputFileName(fileName)) {
		throw new Error(`[fast-vite:subresource-integrity] manifest 必须是 outDir 内的安全相对路径：${fileName}`);
	}
	return fileName;
}

function parseHttpUrl(value: string): URL | undefined {
	if (!/^https?:\/\//i.test(value)) return undefined;
	try {
		return new URL(value);
	} catch {
		return undefined;
	}
}

export type {
	InjectSubresourceIntegrityOptions,
	IntegrityCrossorigin,
	SubresourceIntegrityAlgorithm,
	SubresourceIntegrityFilter,
	SubresourceIntegrityInjectionResult,
	SubresourceIntegrityPluginOptions,
} from "./type";
