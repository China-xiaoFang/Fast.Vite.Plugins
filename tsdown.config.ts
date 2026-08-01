import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
	outDir: "dist",
	format: "esm",
	platform: "node",
	target: "node22",
	// 声明映射让编辑器能够从发布包类型直接跳回仓库源码。
	dts: { sourcemap: true },
	sourcemap: true,
	// 仓库安全规范禁止递归删除，因此构建器不自动清空输出目录。
	clean: false,
	treeshake: true,
	deps: {
		neverBundle: ["vite"],
		dts: { neverBundle: ["vite"] },
	},
});
