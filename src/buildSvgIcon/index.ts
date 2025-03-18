import fs from "fs";
import path from "path";
import type { Plugin, ResolvedConfig } from "vite";

/**
 * 查找 svg 文件
 */

const findSvgFile = (dir: string): { iconName: string; componentName: string; iconContent: string }[] => {
	// svg 内容
	const svgContents: { iconName: string; componentName: string; iconContent: string }[] = [];
	// 获取当前目录下的文件
	const svgFiles = fs.readdirSync(dir, {
		withFileTypes: true,
	});

	svgFiles.forEach((file) => {
		if (file.isDirectory()) {
			svgContents.push(...findSvgFile(path.join(dir, file.name)));
		} else {
			const iconName = file.name.replace(".svg", "");

			const svgContent = fs
				.readFileSync(path.join(dir, file.name), "utf-8")
				.replace(/<\?xml.*?\?>/, "")
				.replace(/<!DOCTYPE svg.*?>/, "")
				// .replace(/(\r)|(\n)/g, "")
				.trimStart()
				.trimEnd()
				// .replace(/(fill="[^>+].*?")/g, 'fill=""')
				.replace(/<svg([^>+].*?)>/, (match, attr) => {
					const viewBoxMatch = attr.match(/viewBox="[^"]+"/);
					const widthMatch = attr.match(/width="(\d+)"/);
					const heightMatch = attr.match(/height="(\d+)"/);
					let width = 1024;
					let height = 1024;
					if (widthMatch) {
						width = widthMatch[0];
					}
					if (heightMatch) {
						height = heightMatch[0];
					}
					let viewBoxContent = "";
					if (!viewBoxMatch) {
						viewBoxContent = `viewBox="0 0 ${width} ${height}"`;
					} else {
						viewBoxContent = viewBoxMatch[0];
					}
					return `<svg xmlns="http://www.w3.org/2000/svg" ${viewBoxContent}>`;
				});

			svgContents.push({
				// iconName: iconName.charAt(0).toUpperCase() + iconName.slice(1),
				iconName,
				componentName: iconName.charAt(0).toUpperCase() + iconName.slice(1),
				iconContent: svgContent,
			});
		}
	});

	return svgContents.sort((a, b) => {
		if (a.iconName < b.iconName) {
			return -1;
		}
		if (a.iconName > b.iconName) {
			return 1;
		}
		return 0;
	});
};

/**
 * 写入 TSX  图标
 */
const writeTSXIcon = (componentName: string, iconDir: string, svgContent: string): void => {
	fs.mkdirSync(iconDir, { recursive: true });

	const componentContent = `import { defineComponent } from "vue";

/**
 * ${componentName} 图标组件
 */
export const ${componentName} = defineComponent({
	name: "${componentName}",
	render() {
		return (
${svgContent
	.split("\n")
	.map((line) => `			${line}`)
	.join("\n")}
		);
	},
});

export default ${componentName};
`;

	fs.writeFileSync(path.join(iconDir, "index.tsx"), componentContent);
};

/**
 * 构建 svg 图标组件
 * @param dir svg 文件路径
 * @param writeDir 写入的文件路径 相对的即可
 */
function buildSvgIcon(dir: string, writeDir: string): Plugin {
	if (!dir || !writeDir) return;

	let config: ResolvedConfig;

	return {
		name: "fast-vite-plugin-build-svg-icon",
		configResolved: (resolvedConfig: ResolvedConfig): void | Promise<void> => {
			// 存储最终解析的配置
			config = resolvedConfig;
		},
		buildStart(): void | Promise<void> {
			const svgFiles = findSvgFile(path.resolve(config.root, dir));

			const iconsPath = path.resolve(config.root, writeDir);
			fs.mkdirSync(iconsPath, { recursive: true });

			let iconImportContent = "";
			let iconTypeContent = "";
			let exportContent = "";

			svgFiles.forEach((svg, idx) => {
				writeTSXIcon(svg.componentName, path.join(iconsPath, svg.iconName), svg.iconContent);

				iconImportContent += `import { ${svg.componentName} } from "./${svg.iconName}";
`;

				iconTypeContent += `	${svg.componentName},`;

				exportContent += `export * from "./${svg.iconName}";
`;

				if (idx + 1 < svgFiles.length) {
					iconTypeContent += "\n";
				}
			});

			fs.writeFileSync(
				path.join(iconsPath, "index.ts"),
				`import type { DefineComponent } from "vue";
${iconImportContent}
${exportContent}
export default [
${iconTypeContent}
] as unknown as DefineComponent[];
`
			);
		},
	};
}

export { findSvgFile, writeTSXIcon, buildSvgIcon };
