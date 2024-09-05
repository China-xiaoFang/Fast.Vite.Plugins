import { Plugin } from 'vite';

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
    modules: (Module | Module[] | GetModuleFunc | GetModuleFunc[])[];
    /**
     * 是否在开发模式启用，默认是 false
     */
    enableInDevMode?: boolean;
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
 * 组件自动导入
 * @description 只会生成安装文件
 * @param dir 组件文件夹路径
 */
declare function componentAutoImport(options: string | AutoImportOptions): Plugin;

/**
 * 版本更新插件
 * @param version 不要携带 'v'，示例：1.0.0
 * @returns
 */
declare function versionUpdatePlugin(version: string): Plugin;

export { type AutoImportOptions, type CdnImportOptions, type GetModuleFunc, type Module, buildSvgIcon, cdnImport, componentAutoImport, versionUpdatePlugin };
