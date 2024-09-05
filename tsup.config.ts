import { defineConfig } from "tsup";

export default defineConfig({
	// 入口文件
	entry: ["packages/index.ts"],
	// 输出目录
	outDir: "fast-vite-plugins/dist",
	// 输出格式
	format: ["cjs", "esm"],
	// 生成类型定义文件
	dts: true,
	// 禁用代码拆分
	splitting: false,
	// 生成 source map
	sourcemap: true,
	// 清理输出目录
	clean: true,
	// 压缩输出文件
	minify: true,
});
