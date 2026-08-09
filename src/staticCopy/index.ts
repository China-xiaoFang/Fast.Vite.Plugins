import { constants } from "node:fs";
import { access, copyFile, cp, lstat, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { isPathInside, isSafeOutputFileName } from "../shared/fileSystem";
import type { StaticCopyPluginOptions, StaticCopyTarget } from "./type";
import type { Plugin, ResolvedConfig } from "vite";

export type { StaticCopyPluginOptions, StaticCopyTarget } from "./type";

/**
 * 复制静态文件或目录，并将目标限制在当前 `outDir`。
 *
 * 源路径和目标路径都按 symlink/junction 边界检查；目标之间不能相同或互相包含。
 *
 * @param root - Vite 项目根目录的绝对路径。
 * @param outDir - 当前 output 的绝对目录。
 * @param targets - 要复制或转换的目标。
 * @param missing - 源不存在时的处理策略。
 * @param onWarning - `missing: "warn"` 时接收诊断信息的回调。
 * @returns 所有目标处理完成后解决的 Promise。
 */
async function copyTargets(
	root: string,
	outDir: string,
	targets: readonly StaticCopyTarget[],
	missing: NonNullable<StaticCopyPluginOptions["missing"]> = "error",
	onWarning: (message: string) => void = () => undefined
): Promise<void> {
	if (targets.length === 0) throw new Error("[fast-vite:static-copy] targets 至少需要一个复制目标。");
	if (missing !== "error" && missing !== "warn" && missing !== "ignore") {
		throw new Error("[fast-vite:static-copy] missing 只能是 error、warn 或 ignore。");
	}
	await assertNoSymlinkInPath(path.parse(outDir).root, outDir, "目标路径");
	const destinations = new Set<string>();
	for (const target of targets) {
		if (!target.src.trim() || !target.dest.trim()) throw new Error("[fast-vite:static-copy] src 与 dest 不能为空路径。");
		if (!isSafeOutputFileName(target.dest)) throw new Error(`[fast-vite:static-copy] dest 必须是合法的构建产物名：${target.dest}`);
		const source = path.resolve(root, target.src);
		const destination = path.resolve(outDir, target.dest);
		if (!isPathInside(outDir, destination)) throw new Error(`[fast-vite:static-copy] 目标必须位于 outDir 内：${target.dest}`);
		if (isPathInside(source, destination) || isPathInside(destination, source)) {
			throw new Error(`[fast-vite:static-copy] 源与目标不能相同或互相包含：${target.src} -> ${target.dest}`);
		}
		const destinationKey = comparablePath(destination);
		if (destinations.has(destinationKey)) throw new Error(`[fast-vite:static-copy] 多个目标会覆盖同一路径：${target.dest}`);
		for (const configuredDestination of destinations) {
			if (isPathInside(configuredDestination, destinationKey) || isPathInside(destinationKey, configuredDestination)) {
				throw new Error(`[fast-vite:static-copy] 多个目标不能相同或互相包含：${target.dest}`);
			}
		}
		destinations.add(destinationKey);

		try {
			await access(source);
		} catch (error) {
			if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
			const message = `[fast-vite:static-copy] 源路径不存在：${source}`;
			if (missing === "error") throw new Error(message);
			if (missing === "warn") onWarning(message);
			continue;
		}

		const sourceBoundary = isPathInside(root, source) ? root : path.parse(source).root;
		await assertNoSymlinkInPath(sourceBoundary, source, "源路径");
		const existingDestinationParent = await nearestExistingDirectory(path.dirname(destination));
		await assertNoSymlinkInPath(outDir, existingDestinationParent, "目标路径");

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
 * @throws 目标为空、路径重叠、symlink/junction、覆盖或多 output 冲突时抛出异常。
 */
export function staticCopy(options: StaticCopyPluginOptions): Plugin {
	const configuredTargets: unknown = options.targets;
	if (!Array.isArray(configuredTargets)) throw new Error("[fast-vite:static-copy] targets 必须是数组。");
	if (options.targets.length === 0) throw new Error("[fast-vite:static-copy] targets 至少需要一个复制目标。");
	for (const target of options.targets) {
		if (!target || typeof target !== "object" || Array.isArray(target) || typeof target.src !== "string" || typeof target.dest !== "string") {
			throw new Error("[fast-vite:static-copy] 每个 target 都必须包含字符串 src 与 dest。");
		}
		if (!target.src.trim() || !isSafeOutputFileName(target.dest)) {
			throw new Error("[fast-vite:static-copy] src 不能为空，dest 必须是合法的构建产物名。");
		}
	}
	if (options.missing && !["error", "warn", "ignore"].includes(options.missing)) {
		throw new Error("[fast-vite:static-copy] missing 只能是 error、warn 或 ignore。");
	}
	let config: ResolvedConfig;
	const copiedOutputDirectories = new Set<string>();

	return {
		name: "fast-vite:static-copy",
		apply: "build",
		configResolved(resolvedConfig): void {
			config = resolvedConfig;
		},
		buildStart(): void {
			copiedOutputDirectories.clear();
		},
		async writeBundle(outputOptions): Promise<void> {
			const configuredOutDir = outputOptions.dir ?? (outputOptions.file ? path.dirname(outputOptions.file) : config.build.outDir);
			const outDir = path.resolve(config.root, configuredOutDir);
			const key = comparablePath(outDir);
			if (copiedOutputDirectories.has(key)) return;
			copiedOutputDirectories.add(key);
			await copyTargets(config.root, outDir, options.targets, options.missing, (message) => config.logger.warn(message));
		},
	};
}

async function nearestExistingDirectory(directory: string): Promise<string> {
	let current = directory;
	while (true) {
		try {
			if ((await stat(current)).isDirectory()) return current;
		} catch (error) {
			if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
		}
		const parent = path.dirname(current);
		if (parent === current) return current;
		current = parent;
	}
}

function comparablePath(filePath: string): string {
	const resolved = path.resolve(filePath);
	return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

async function assertNoSymlinkInPath(base: string, candidate: string, label: string): Promise<void> {
	const relativePath = path.relative(path.resolve(base), path.resolve(candidate));
	if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
		throw new Error(`[fast-vite:static-copy] ${label}越出允许边界：${candidate}`);
	}
	let current = path.resolve(base);
	for (const segment of relativePath.split(path.sep).filter(Boolean)) {
		current = path.join(current, segment);
		try {
			if ((await lstat(current)).isSymbolicLink()) {
				throw new Error(`[fast-vite:static-copy] ${label}不能经过 symlink 或 junction：${candidate}`);
			}
		} catch (error) {
			if (error instanceof Error && "code" in error && error.code === "ENOENT") return;
			throw error;
		}
	}
}
