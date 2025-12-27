import fs from "fs";
import path from "path";
import type { BuildRouterPathOptions } from "./type";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";

/**
 * Pascal Case 转换
 */
function pascalCase(str: string): string {
	return str.replace(/[-_](\w)/g, (_, c) => (c ? c.toUpperCase() : "")).replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * 从文件内容中提取组件名称
 */
function extractComponentName(fileContent: string): string | null {
	// 匹配 defineOptions({ name: 'xxx' })
	const defineOptionsRegex = /defineOptions\(\s*\{\s*name:\s*["']([^"']+)["']/;
	const defineOptionsMatch = fileContent.match(defineOptionsRegex);
	return defineOptionsMatch ? defineOptionsMatch[1] : null;
}

/**
 * 路由路径生成
 * @param options 选项
 */
function buildRouterPath(options: BuildRouterPathOptions = {}): Plugin {
	const { dir = "src/views", exportPath = "src/router/index.json", deep = true, extensions = ["vue", "tsx", "jsx"], formatter } = options;

	let config: ResolvedConfig;
	let watcher: fs.FSWatcher | null = null;

	/** 递归获取目录下所有符合扩展名的文件*/
	const getAllFiles = (dirPath: string, fileList: string[] = []): string[] => {
		if (!fs.existsSync(dirPath)) {
			return fileList;
		}

		const files = fs.readdirSync(dirPath);
		files.forEach((file) => {
			const filePath = path.join(dirPath, file);
			const stat = fs.statSync(filePath);

			if (stat.isDirectory()) {
				if (deep) {
					getAllFiles(filePath, fileList);
				}
			} else {
				const ext = path.extname(filePath).slice(1);
				if (extensions.includes(ext)) {
					fileList.push(filePath);
				}
			}
		});

		return fileList;
	};

	/** 生成路径-名称映射 */
	const generatePathNameMap = (): void => {
		const targetDir = path.resolve(config.root, dir);
		const files = getAllFiles(targetDir);

		const pathNameMap: Record<string, string> = files.reduce((acc, filePath) => {
			try {
				const content = fs.readFileSync(filePath, "utf-8");
				const componentName = extractComponentName(content);

				// 生成相对路径
				const relativePath = `/${path.relative(config.root, filePath).replace(/\\/g, "/")}`;

				// 确定最终的组件名称
				let finalName: string;
				if (componentName) {
					finalName = componentName;
				} else {
					const fileName = path.basename(filePath, path.extname(filePath));
					finalName = formatter ? formatter(fileName) : pascalCase(fileName);
				}

				acc[relativePath] = finalName;
			} catch (error) {
				console.error(`Error processing file ${filePath}:`, error);
			}
			return acc;
		}, {});

		// 写入 JSON 文件
		const outputPath = path.resolve(config.root, exportPath);
		const outputDir = path.dirname(outputPath);

		// 确保输出目录存在
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		const outputContent = JSON.stringify(pathNameMap, null, 2);
		fs.writeFileSync(outputPath, outputContent, "utf-8");
	};

	return {
		name: "fast-vite-plugin-router-path",
		enforce: "post",
		configResolved: (resolvedConfig: ResolvedConfig): void | Promise<void> => {
			// 存储最终解析的配置
			config = resolvedConfig;
		},
		buildStart(): void | Promise<void> {
			generatePathNameMap();
		},
		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		configureServer(server: ViteDevServer) {
			const fullDir = path.resolve(config.root, dir);

			// 监听文件变化
			if (fs.existsSync(fullDir)) {
				watcher = fs.watch(fullDir, { recursive: true }, (eventType, filename) => {
					if (!filename) return;
					// 忽略 . d.ts 文件和 JSON 文件
					if (filename.endsWith(".d.ts") || filename.endsWith(".json")) return;

					// 检查是否是组件文件
					const ext = path.extname(filename).slice(1);
					if (!extensions.includes(ext)) return;

					generatePathNameMap();

					// 通知客户端刷新
					server.ws.send({ type: "full-reload", path: "*" });
				});
			}
		},
		buildEnd(): void | Promise<void> {
			// 关闭监听器
			if (watcher) {
				watcher.close();
				watcher = null;
			}
		},
	};
}

export { buildRouterPath };
