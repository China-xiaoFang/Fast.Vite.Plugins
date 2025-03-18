export interface AutoImportOptions {
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
