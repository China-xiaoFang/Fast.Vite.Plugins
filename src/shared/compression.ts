import { promisify } from "node:util";
import { brotliCompress, gzip } from "node:zlib";

import type { CompressionAlgorithm, CompressionPluginOptions } from "../compression/type";

const gzipAsync = promisify(gzip);
const brotliAsync = promisify(brotliCompress);

/**
 * 使用 Node.js zlib 压缩构建产物，供预算测量和预压缩插件复用。
 *
 * @param content - 原始字节内容。
 * @param algorithm - `gzip` 或 `brotli`。
 * @param options - 对应编码器的 zlib 选项。
 * @returns 压缩后的字节缓冲区。
 */
export async function compressBytes(
	content: Uint8Array,
	algorithm: CompressionAlgorithm,
	options: Pick<CompressionPluginOptions, "brotliOptions" | "gzipOptions"> = {}
): Promise<Buffer> {
	return algorithm === "gzip" ? gzipAsync(content, options.gzipOptions) : brotliAsync(content, options.brotliOptions);
}
