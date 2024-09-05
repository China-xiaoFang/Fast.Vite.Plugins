import fs from "fs";
import path from "path";
import type { Plugin, ResolvedConfig } from "vite";

function padZero(num: number, length = 2): string {
	return num.toString().padStart(length, "0");
}

function formatDate(date: Date): string {
	const year = date.getUTCFullYear();
	const month = padZero(date.getUTCMonth() + 1);
	const day = padZero(date.getUTCDate());
	const hours = padZero(date.getUTCHours());
	const minutes = padZero(date.getUTCMinutes());
	const seconds = padZero(date.getUTCSeconds());
	const milliseconds = padZero(date.getUTCMilliseconds(), 3);

	return `Z ${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * 版本更新插件
 * @param version 不要携带 'v'，示例：1.0.0
 * @returns
 */
function versionUpdatePlugin(version: string): Plugin {
	let config: ResolvedConfig;

	return {
		name: "fast-vite-plugin-version-update",
		configResolved: (resolvedConfig: ResolvedConfig): void | Promise<void> => {
			// 存储最终解析的配置
			config = resolvedConfig;
		},
		buildStart(): void | Promise<void> {
			const curDate = new Date();

			const dateTime = formatDate(curDate);

			const versionDir = config.publicDir;
			const versionPath = path.join(versionDir, "version.json");
			if (!fs.existsSync(versionDir)) {
				fs.mkdirSync(versionDir);
			}

			// 写入版本信息文件
			const content = JSON.stringify({ version: `v${version}`, dateTime }, null, 4);
			fs.writeFileSync(versionPath, content);

			const pkgPath = path.join(config.base, "package.json");
			if (fs.existsSync(pkgPath)) {
				const pkgJson = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
				pkgJson.version = version;
				fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2), "utf-8");
			}
		},
	};
}

export { versionUpdatePlugin };
