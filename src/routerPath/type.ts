export interface BuildRouterPathOptions {
	/**
	 * 文件夹
	 * @default "src/views"
	 */
	dir?: string;
	/**
	 * 导出声明文件路径
	 * @default "src/router/index.json"
	 */
	exportPath?: string;
	/**
	 * 是否深度扫描子目录
	 * @default true
	 */
	deep?: boolean;
	/**
	 * 文件扩展名
	 * @default ["vue","tsx","jsx"]
	 */
	extensions?: string[];
	/**
	 * 自定义组件名称
	 * @param fName 文件夹名称
	 * @returns
	 */
	formatter?: (fName: string) => string;
}
