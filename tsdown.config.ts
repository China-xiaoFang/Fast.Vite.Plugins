import { defineConfig } from "tsdown";

export default defineConfig({
	// 只生成 package.json exports 声明的根入口；各插件由 src/index.ts 聚合。
	entry: { index: "src/index.ts" },
	// 将全部发布文件写入仓库根目录的唯一 dist 目录。
	outDir: "dist",
	// 仅输出 ESM，与 package.json 的 module 类型和 exports.import 保持一致。
	format: "esm",
	// 按 Node.js 插件运行时处理内置模块和依赖，不注入浏览器兼容层。
	platform: "node",
	// 以最低支持的 Node.js 22 为语法转换目标。
	target: "node22",
	// 固定生成 .mjs 和 .d.mts，与 package.json exports 的公开路径保持一致。
	fixedExtension: true,
	// 生成 TypeScript 声明及其映射，使编辑器可以从发布类型定位源码。
	dts: { sourcemap: true },
	// 生成 JavaScript source map，支持构建期异常定位到插件源码。
	sourcemap: true,
	// 每次构建前清空完整 dist，避免入口删除或重命名后残留陈旧产物。
	clean: true,
	// 移除未被公共入口引用的内部代码，减小运行时产物体积。
	treeshake: true,
	// 控制依赖在 JavaScript 和声明构建中的外部化行为。
	deps: {
		// Vite 是 peer dependency，运行时代码保留对消费项目 Vite 的引用。
		neverBundle: ["vite"],
		// 声明生成同样不内联 Vite 类型，避免复制第三方声明并固定其具体版本。
		dts: { neverBundle: ["vite"] },
	},
	// 将构建警告视为失败，防止带有潜在问题的产物进入发布流程。
	failOnWarn: true,
});
