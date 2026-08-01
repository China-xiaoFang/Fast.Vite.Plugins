import { promisify } from "node:util";
import { brotliCompress, gzip } from "node:zlib";

import { isSafeOutputFileName } from "../shared/fileSystem";

import type { CompressionAlgorithm, CompressionPluginOptions } from "./type";
import type { Plugin } from "vite";

type CompressibleOutput = { code: string; type: "chunk" } | { source: string | Uint8Array; type: "asset" };

const gzipAsync = promisify(gzip);
const brotliAsync = promisify(brotliCompress);
const DEFAULT_FILTER = /\.(?:css|html?|js|json|mjs|svg|txt|wasm|xml)$/i;

/**
 * 使用 Node.js 原生 zlib 压缩一段内容。
 *
 * @param content - 原始二进制内容。
 * @param algorithm - `gzip` 或 `brotli`。
 * @param options - 对应 zlib 编码器的选项。
 * @returns 原生 zlib 编码后的 Buffer。
 */
export async function compressContent(
	content: Uint8Array,
	algorithm: CompressionAlgorithm,
	options: Pick<CompressionPluginOptions, "brotliOptions" | "gzipOptions"> = {}
): Promise<Buffer> {
	return algorithm === "gzip" ? gzipAsync(content, options.gzipOptions) : brotliAsync(content, options.brotliOptions);
}

/**
 * 为构建产物生成 `.gz` / `.br` 预压缩文件，适合 Nginx、Caddy 与对象存储直接提供静态压缩资源。
 *
 * @param options - 压缩算法、阈值、收益率、过滤器和编码器选项。
 * @returns 可直接加入 Vite `plugins` 的预压缩插件。
 */
export function createCompressionPlugin(options: CompressionPluginOptions = {}): Plugin {
	const configuredAlgorithms = options.algorithms ?? ["gzip", "brotli"];
	const algorithms = [...new Set(typeof configuredAlgorithms === "string" ? [configuredAlgorithms] : configuredAlgorithms)];
	const threshold = options.threshold ?? 1024;
	const minRatio = options.minRatio ?? 0.95;
	const filter = options.filter ?? DEFAULT_FILTER;

	if (!Number.isFinite(threshold) || threshold < 0) throw new Error("[fast-vite:compression] threshold 必须是大于或等于 0 的有限数值。");
	if (minRatio <= 0 || minRatio > 1) throw new Error("[fast-vite:compression] minRatio 必须大于 0 且不超过 1。");
	if (algorithms.length === 0 || algorithms.some((algorithm) => algorithm !== "gzip" && algorithm !== "brotli")) {
		throw new Error("[fast-vite:compression] algorithms 只能包含 gzip 或 brotli。");
	}

	return {
		name: "fast-vite:compression",
		apply: "build",
		enforce: "post",
		generateBundle: {
			order: "post",
			async handler(_outputOptions, bundle): Promise<void> {
				const emittedNames = new Set(Object.keys(bundle));
				for (const [originalFileName, output] of Object.entries(bundle)) {
					if (!matchesFilter(originalFileName, filter)) continue;
					const content = outputToBuffer(output);
					if (content.byteLength < threshold) continue;

					for (const algorithm of algorithms) {
						const compressed = await compressContent(content, algorithm, options);
						if (compressed.byteLength / content.byteLength >= minRatio) continue;
						const fileName =
							options.fileName?.(originalFileName, algorithm) ?? `${originalFileName}${algorithm === "gzip" ? ".gz" : ".br"}`;
						if (!isSafeOutputFileName(fileName) || emittedNames.has(fileName)) {
							throw new Error(`[fast-vite:compression] 压缩文件名无效或与现有产物冲突：${fileName}`);
						}
						this.emitFile({ type: "asset", fileName, source: compressed });
						emittedNames.add(fileName);
					}
				}
			},
		},
	};
}

function matchesFilter(fileName: string, filter: RegExp | ((fileName: string) => boolean)): boolean {
	if (typeof filter === "function") return filter(fileName);
	filter.lastIndex = 0;
	return filter.test(fileName);
}

function outputToBuffer(output: CompressibleOutput): Buffer {
	if (output.type === "chunk") return Buffer.from(output.code);
	return typeof output.source === "string" ? Buffer.from(output.source) : Buffer.from(output.source);
}

export type { CompressionAlgorithm, CompressionPluginOptions } from "./type";
