import fs from "fs";
import path from "path";
import type { AutoImportOptions } from "./type";
import type { Plugin } from "vite";

/**
 * TSX组件自动导入
 * @description 只会生成安装文件
 * @param options 组件文件夹路径
 */
function tsxComponentAutoImport(options: string | AutoImportOptions): Plugin {
	if (!options) return;

	return {
		name: "fast-vite-plugin-tsx-component-auto-import",
		buildStart(): void | Promise<void> {
			const dir = typeof options === "string" ? options : options.dir;

			const defaultFormatter = (fName: string): string => {
				return fName.charAt(0).toUpperCase() + fName.slice(1);
			};

			const formatter = typeof options === "string" ? defaultFormatter : (options.formatter ?? defaultFormatter);

			// 获取所有文件夹名称
			const cFiles = fs.readdirSync(dir, {
				withFileTypes: true,
			});

			if (cFiles?.length === 0) return;

			// 组件名称
			const cNames = cFiles
				// 排除export文件
				.filter((f) => f.name !== "index.ts")
				.map((file) => {
					return {
						componentName: formatter(file.name),
						fileName: file.name,
					};
				})
				.sort((a, b) => {
					if (a.componentName < b.componentName) {
						return -1;
					}
					if (a.componentName > b.componentName) {
						return 1;
					}
					return 0;
				});

			let importContent = "";
			let exportContent = "";
			let typeContent = "";

			cNames.forEach(({ componentName, fileName }, idx) => {
				importContent += `import { ${componentName} } from "./${fileName}";
`;

				exportContent += `export * from "./${fileName}";
`;

				typeContent += `	${componentName},`;

				if (idx + 1 < cNames.length) {
					typeContent += "\n";
				}
			});

			fs.writeFileSync(
				path.join(dir, "index.ts"),
				`import type { Plugin } from "vue";
${importContent}
${exportContent}
export default [
${typeContent}
] as Plugin[];
`
			);
		},
	};
}

/**
 * VUE组件自动导入
 * @description 只会生成安装文件
 * @param options 组件文件夹路径
 */
function vueComponentAutoImport(options: string | AutoImportOptions): Plugin {
	if (!options) return;

	return {
		name: "fast-vite-plugin-vue-component-auto-import",
		buildStart(): void | Promise<void> {
			const dir = typeof options === "string" ? options : options.dir;

			const defaultFormatter = (fName: string): string => {
				return fName.charAt(0).toUpperCase() + fName.slice(1);
			};

			const formatter = typeof options === "string" ? defaultFormatter : (options.formatter ?? defaultFormatter);

			// 获取所有文件夹名称
			const cFiles = fs.readdirSync(dir, {
				withFileTypes: true,
			});

			if (cFiles?.length === 0) return;

			// 组件名称
			const cNames = cFiles
				// 排除export文件
				.filter((f) => f.name !== "index.ts")
				.map((file) => {
					return {
						componentName: formatter(file.name),
						fileName: file.name,
					};
				})
				.sort((a, b) => {
					if (a.componentName < b.componentName) {
						return -1;
					}
					if (a.componentName > b.componentName) {
						return 1;
					}
					return 0;
				});

			let importContent = "";
			let exportContent = "";
			let typeContent = "";

			cNames.forEach(({ componentName, fileName }, idx) => {
				importContent += `import ${componentName} from "./${fileName}/index.vue";
`;

				exportContent += `export * from "./${fileName}/index.vue";
`;

				typeContent += `	${componentName},`;

				if (idx + 1 < cNames.length) {
					typeContent += "\n";
				}
			});

			fs.writeFileSync(
				path.join(dir, "index.ts"),
				`import type { DefineComponent } from "vue";
${importContent}
${exportContent}
export default [
${typeContent}
] as unknown as DefineComponent[];
`
			);
		},
	};
}

export { tsxComponentAutoImport, vueComponentAutoImport };
