import fs from "fs";
import path from "path";
/**
 * 查找 svg 文件
 */
const findSvgFile = (dir) => {
    // svg 内容
    const svgContents = [];
    // 获取当前目录下的文件
    const svgFiles = fs.readdirSync(dir, {
        withFileTypes: true,
    });
    svgFiles.forEach((file) => {
        if (file.isDirectory()) {
            svgContents.push(...findSvgFile(path.join(dir, file.name)));
        }
        else {
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
                }
                else {
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
const writeTSXIcon = (iconName, componentName, iconDir, svgContent) => {
    const srcDir = path.join(iconDir, "src");
    fs.mkdirSync(iconDir, { recursive: true });
    fs.mkdirSync(srcDir, { recursive: true });
    const iconContent = `import { defineComponent } from "vue";

/**
 * ${componentName} 图标组件
 */
export default defineComponent({
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
`;
    fs.writeFileSync(path.join(srcDir, `${iconName}.tsx`), iconContent);
    const indexContent = `import { withInstall } from "fast-element-plus";
import ${componentName}TSX from "./src/${iconName}.tsx";

export const ${componentName} = withInstall(${componentName}TSX);
export default ${componentName};
`;
    fs.writeFileSync(path.join(iconDir, "index.ts"), indexContent);
    const indexDTS = `import type { TSXWithInstall } from "fast-element-plus";
import type { default as ${componentName}TSX } from "./src/${iconName}";

export declare const ${componentName}: TSXWithInstall<typeof ${componentName}TSX>;
export default ${componentName};
`;
    fs.writeFileSync(path.join(iconDir, "index.d.ts"), indexDTS);
};
/**
 * 构建 svg 图标组件
 * @param dir svg 文件路径
 * @param writeDir 写入的文件路径 相对的即可
 */
function buildSvgIcon(dir, writeDir) {
    if (!dir || !writeDir)
        return;
    let config;
    return {
        name: "fast-vite-plugin-build-svg-icon",
        configResolved: (resolvedConfig) => {
            // 存储最终解析的配置
            config = resolvedConfig;
        },
        buildStart() {
            const svgFiles = findSvgFile(path.resolve(config.root, dir));
            const iconsPath = path.resolve(config.root, writeDir);
            fs.mkdirSync(iconsPath, { recursive: true });
            let iconImportContent = "";
            let iconTypeContent = "";
            let exportContent = "";
            svgFiles.forEach((svg, idx) => {
                writeTSXIcon(svg.iconName, svg.componentName, path.join(iconsPath, svg.iconName), svg.iconContent);
                iconImportContent += `import { ${svg.componentName} } from "./${svg.iconName}";
`;
                iconTypeContent += `	${svg.iconName},`;
                exportContent += `export * from "./${svg.iconName}";
`;
                if (idx + 1 < svgFiles.length) {
                    iconTypeContent += "\n";
                }
            });
            fs.writeFileSync(path.join(iconsPath, "index.ts"), `import type { DefineComponent } from "vue";
${iconImportContent}
${exportContent}
export default [
${iconTypeContent}
] as Plugin[];
`);
        },
    };
}
export { findSvgFile, writeTSXIcon, buildSvgIcon };
