import { Plugin, HtmlTagDescriptor } from 'vite';

/**
 * 查找 svg 文件
 */
declare const findSvgFile: (dir: string) => {
    iconName: string;
    componentName: string;
    iconContent: string;
}[];
/**
 * 写入 TSX  图标
 */
declare const writeTSXIcon: (componentName: string, iconDir: string, svgContent: string) => void;
/**
 * 构建 svg 图标组件
 * @param dir svg 文件路径
 * @param writeDir 写入的文件路径 相对的即可
 */
declare function buildSvgIcon(dir: string, writeDir: string): Plugin;

interface Module {
    /**
     * 模块名称
     */
    name: string;
    /**
     * 模块变量
     */
    var: string;
    /**
     * 版本号
     * @description 如果不传则默认从 node_modules 中获取
     */
    version?: string;
    /**
     * 模块路径
     */
    path: string | string[];
    /**
     * 名称的别名，例如 "react-dom/client" 是 "react-dom" 的别名
     */
    alias?: string[];
    /**
     * CSS 文件路径
     */
    css?: string | string[];
    /**
     * 生产环境 URL
     */
    prodUrl?: string;
    /**
     * 元素的其他属性
     */
    attrs?: Record<string, any>;
}
type GetModuleFunc = (prodUrl: string) => Module;
interface CdnImportOptions {
    /**
     * 生产环境 URL
     */
    prodUrl?: string;
    modules: Module | Module[] | GetModuleFunc | GetModuleFunc[];
    /**
     * 是否在开发模式启用，默认是 false
     */
    enableInDevMode?: boolean;
    /** 生成 script 脚本标记 */
    generateScriptTag?: (name: string, scriptUrl: string) => Omit<HtmlTagDescriptor, "tag" | "children">;
    /** 生成 css link 脚本标记  */
    generateCssLinkTag?: (name: string, cssUrl: string) => Omit<HtmlTagDescriptor, "tag" | "children">;
}

/**
 * CDN 导入
 * @param options
 * @returns
 */
declare function cdnImport(options: CdnImportOptions): Plugin[];

interface AutoImportOptions {
    /**
     * 文件夹
     */
    dir: string;
    /**
     * 自定义组件名称
     * @param fName 文件夹名称
     * @returns
     */
    formatter?: (fName: string) => string;
}

/**
 * TSX组件自动导入
 * @description 只会生成安装文件
 * @param options 组件文件夹路径
 */
declare function tsxComponentAutoImport(options: string | AutoImportOptions): Plugin;
/**
 * VUE组件自动导入
 * @description 只会生成安装文件
 * @param options 组件文件夹路径
 */
declare function vueComponentAutoImport(options: string | AutoImportOptions): Plugin;

/**
 * 版本更新插件
 * @param version 不要携带 'v'，示例：1.0.0
 * @returns
 */
declare function versionUpdatePlugin(version: string): Plugin;

export { type AutoImportOptions, type CdnImportOptions, type GetModuleFunc, type Module, buildSvgIcon, cdnImport, findSvgFile, tsxComponentAutoImport, versionUpdatePlugin, vueComponentAutoImport, writeTSXIcon };
