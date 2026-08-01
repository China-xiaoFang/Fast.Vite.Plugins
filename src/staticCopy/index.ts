import { constants } from "node:fs";
import { access, copyFile, cp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { isPathInside } from "../shared/fileSystem";

import type { StaticCopyPluginOptions, StaticCopyTarget } from "./type";
import type { Plugin, ResolvedConfig } from "vite";

/**
 * 执行静态文件复制，且将目标限制在 `outDir` 内。
 *
 * @param root - Vite 项目根目录的绝对路径。
 * @param outDir - 构建输出目录的绝对路径。
 * @param targets - 要复制或转换的文件与目录。
 * @param missing - 源路径不存在时的处理策略。
 * @param onWarning - `missing: "warn"` 时接收诊断信息的回调。
 * @returns 所有目标处理完成后解决的 Promise。
 */
export async function copyStaticTargets(
	root: string,
	outDir: string,
	targets: readonly StaticCopyTarget[],
	missing: NonNullable<StaticCopyPluginOptions["missing"]> = "error",
	onWarning: (message: string) => void = () => undefined
): Promise<void> {
	for (const target of targets) {
		const source = path.resolve(root, target.src);
		const destination = path.resolve(outDir, target.dest);
		if (!isPathInside(outDir, destination)) throw new Error(`[fast-vite:static-copy] 目标必须位于 outDir 内：${target.dest}`);

		try {
			await access(source);
		} catch (error) {
			if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
			const message = `[fast-vite:static-copy] 源路径不存在：${source}`;
			if (missing === "error") throw new Error(message);
			if (missing === "warn") onWarning(message);
			continue;
		}

		const sourceStat = await stat(source);
		const overwrite = target.overwrite ?? true;
		if (sourceStat.isDirectory()) {
			if (target.transform) throw new Error(`[fast-vite:static-copy] 目录目标不支持 transform：${target.src}`);
			await mkdir(path.dirname(destination), { recursive: true });
			await cp(source, destination, { errorOnExist: !overwrite, force: overwrite, recursive: true });
			continue;
		}
		if (!sourceStat.isFile()) throw new Error(`[fast-vite:static-copy] 仅支持普通文件和目录：${source}`);

		await mkdir(path.dirname(destination), { recursive: true });
		if (target.transform) {
			const transformed = await target.transform(await readFile(source), source);
			await writeFile(destination, transformed, { flag: overwrite ? "w" : "wx" });
		} else {
			await copyFile(source, destination, overwrite ? 0 : constants.COPYFILE_EXCL);
		}
	}
}

/**
 * 在 Vite 写出构建产物后复制许可证、robots.txt 或其他静态目录。
 *
 * @param options - 复制目标及源路径缺失时的处理方式。
 * @returns 可直接加入 Vite `plugins` 的静态复制插件。
 */
export function createStaticCopyPlugin(options: StaticCopyPluginOptions): Plugin {
	if (options.targets.length === 0) throw new Error("[fast-vite:static-copy] targets 至少需要一个复制目标。");
	let config: ResolvedConfig;

	return {
		name: "fast-vite:static-copy",
		apply: "build",
		configResolved(resolvedConfig): void {
			config = resolvedConfig;
		},
		async writeBundle(): Promise<void> {
			const outDir = path.resolve(config.root, config.build.outDir);
			await copyStaticTargets(config.root, outDir, options.targets, options.missing, (message) => config.logger.warn(message));
		},
	};
}

export type { StaticCopyPluginOptions, StaticCopyTarget } from "./type";
