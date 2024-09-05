import fs from "fs";
import path from "path";
import type { Plugin, ResolvedConfig } from "vite";

/**
 * 查找 svg 文件
 */
function findSvgFile(dir: string): { iconName: string; iconContent: string }[] {
	// svg 内容
	const svgContents: { iconName: string; iconContent: string }[] = [];
	// 获取当前目录下的文件
	const svgFiles = fs.readdirSync(dir, {
		withFileTypes: true,
	});

	svgFiles.forEach((file) => {
		if (file.isDirectory()) {
			svgContents.push(...findSvgFile(path.join(dir, file.name)));
		} else {
			const iconName = file.name.replace(".svg", "");

			const svgInfo = fs
				.readFileSync(path.join(dir, file.name))
				.toString()
				.replace(/<\?xml.*?\?>/, "")
				.replace(/<!DOCTYPE svg.*?>/, "")
				.replace(/(\r)|(\n)/g, "")
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
				iconName: iconName.charAt(0).toUpperCase() + iconName.slice(1),
				iconContent: svgInfo,
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
}

/**
 * 写入 TSX  组件
 */
function writeTsxComponent(componentName: string, componentDir: string, content: string): void {
	fs.mkdirSync(componentDir, { recursive: true });

	const componentContent = `import { defineComponent } from "vue";
import { ElIcon } from "element-plus";

/**
 * ${componentName} 图标组件
 */
export const ${componentName} = defineComponent({
	name: "${componentName}",
	components: {
		ElIcon,
	},
	setup(props, { attrs, slots, emit, expose }) {
		expose({});

		return {
			attrs,
			slots,
		};
	},
	render() {
		return (
			<ElIcon {...this.attrs} class="el-icon icon fa-icon fa-icon-${componentName}">
				${content}
			</ElIcon>
		);
	},
});

export default ${componentName};
`;

	fs.writeFileSync(path.join(componentDir, "index.tsx"), componentContent);
}

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

			const svgCRPath = path.resolve(config.root, writeDir);
			fs.mkdirSync(svgCRPath, { recursive: true });

			let importContent = "";
			let exportContent = "";
			let typeContent = "";

			svgFiles.forEach((svg, idx) => {
				writeTsxComponent(svg.iconName, path.join(svgCRPath, svg.iconName), svg.iconContent);

				importContent += `import { ${svg.iconName} } from "./${svg.iconName}";\n`;
				exportContent += `export * from "./${svg.iconName}";\n`;

				typeContent += `	${svg.iconName},`;

				if (idx + 1 < svgFiles.length) {
					typeContent += "\n";
				}
			});

			fs.writeFileSync(
				path.resolve(svgCRPath, "index.ts"),
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

export { buildSvgIcon };
