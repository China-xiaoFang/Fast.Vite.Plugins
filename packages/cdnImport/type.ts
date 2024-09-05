export interface Module {
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

export type GetModuleFunc = (prodUrl: string) => Module;

export interface CdnImportOptions {
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
