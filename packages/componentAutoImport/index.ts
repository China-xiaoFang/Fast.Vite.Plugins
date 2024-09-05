import fs from "fs";
import path from "path";
import type { Plugin } from "vite";
import type { AutoImportOptions } from "./type";

/**
 * 组件自动导入
 * @description 只会生成安装文件
 * @param dir 组件文件夹路径
 */
function componentAutoImport(options: string | AutoImportOptions): Plugin {
	if (!options) return;

	return {
		name: "fast-vite-plugin-component-auto-import",
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
				importContent += `import ${componentName} from "./${fileName}/index.vue";\n`;
				exportContent += `export * from "./${fileName}/index.vue";\n`;

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

export { componentAutoImport };
