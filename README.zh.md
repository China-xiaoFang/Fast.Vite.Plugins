<p align="left">
	<strong>简体中文</strong> | <a href="./README.md">English</a>
</p>

<p align="center">
	<img src="./Fast.png" alt="logo" width="160" />
</p>

# fast-vite-plugins

面向现代 Web 应用的公开开源 Vite 插件库，提供完整类型、独立插件函数、严格安全边界、测试、CI、发布校验和框架级文档。

[![npm](https://img.shields.io/npm/v/fast-vite-plugins)](https://www.npmjs.com/package/fast-vite-plugins) [![node](https://img.shields.io/badge/node-%5E22.18%20%7C%7C%20%5E24.18-brightgreen)](https://nodejs.org/) [![vite](https://img.shields.io/badge/vite-7%20%7C%7C%208-646cff)](https://vite.dev/) [![license](https://img.shields.io/npm/l/fast-vite-plugins)](./LICENSE)

## 特性

- ESM-only 发布，Vite 是唯一 peer dependency，插件库本身没有运行时依赖。
- 以 Web 应用为核心，覆盖开发体验、HTML、资源、安全、可观测性和生产质量门禁。
- 每个插件只提供一个功能名函数，项目只需导入实际使用的插件。
- 生成结果稳定排序且仅在内容变化时写入，减少无意义 HMR 和缓存失效。
- 输出路径具备目录边界检查；文件监听具备防抖、关闭清理和名称冲突诊断。
- TypeScript 6 严格模式、类型感知 ESLint 10、真实 Vite 构建和公开 API 类型测试共同组成质量门禁。
- 支持 Vite 7 和 8；运行环境要求 Node.js `^22.18.0 || ^24.18.0`。

## 插件一览

| API                    | 用途                                               |
| ---------------------- | -------------------------------------------------- |
| `componentRegistry`    | 扫描 Vue/TSX/JSX 组件，生成注册入口和 Vue 全局类型 |
| `routerMeta`           | 生成页面路径与稳定组件名 JSON 映射                 |
| `svgIcons`             | 将 SVG 目录生成单文件 Vue 图标组件模块             |
| `cdnImport`            | 注入 CDN 标签，并将 ESM 导入映射为浏览器全局变量   |
| `buildInfo`            | 输出构建信息 JSON、开发端点和虚拟模块              |
| `bundleBudget`         | 对单文件或产物总和执行原始/压缩体积预算            |
| `compression`          | 生成 gzip、Brotli 预压缩资源                       |
| `subresourceIntegrity` | 为本地 JavaScript/CSS 注入 SRI 完整性摘要          |
| `devRestart`           | 外部配置文件变化时防抖重启开发服务器               |
| `staticCopy`           | 构建后安全复制或转换静态文件与目录                 |
| `virtualModules`       | 声明静态或动态虚拟 ESM 模块                        |
| `envGuard`             | 在启动/构建前校验环境变量且不泄露变量值            |
| `htmlTemplate`         | 安全替换 HTML 占位符并注入 Vite HTML 标签描述符    |

## 安装

```bash
pnpm add -D fast-vite-plugins
```

消费项目必须使用 ESM Vite 配置，并安装 Vite 7 或 8。

## 快速开始

```ts
import { defineConfig } from "vite";

import { buildInfo, bundleBudget, compression, envGuard, subresourceIntegrity } from "fast-vite-plugins";

export default defineConfig({
	plugins: [
		envGuard({
			schema: {
				VITE_API_URL: { pattern: /^https:\/\// },
			},
		}),
		buildInfo(),
		subresourceIntegrity({ manifest: true }),
		bundleBudget({
			budgets: [
				{ name: "入口 JS", filter: /\.js$/, limit: 250 * 1024 },
				{ name: "全部 CSS（gzip）", filter: /\.css$/, limit: 50 * 1024, mode: "gzip", scope: "total" },
			],
		}),
		compression({
			algorithms: ["gzip", "brotli"],
			threshold: 10 * 1024,
		}),
	],
});
```

每个插件都需要独立导入和配置，库不会隐式启用任何能力：

```ts
import { buildInfo, htmlTemplate } from "fast-vite-plugins";

export default defineConfig({
	plugins: [htmlTemplate({ data: { APP_TITLE: "Fast Admin" }, strict: true }), buildInfo({ fileName: "meta/build-info.json" })],
});
```

## 常用场景

### 组件注册与类型

```ts
componentRegistry({
	dirs: ["src/components", "src/features"],
	output: "src/components/index.ts",
	dts: "types/components.d.ts",
	conflict: "error",
});
```

生成模块提供每个组件的命名导出、`components` 注册表和 `registerComponents(app)`。`index.vue` 默认使用父目录名，所有名称都必须是唯一且合法的 JavaScript 标识符。

### CDN 外部化

```ts
cdnImport({
	modules: [
		{
			name: "vue",
			global: "Vue",
			version: "3.5.0",
			js: "dist/vue.global.prod.js",
		},
	],
	dev: false,
});
```

支持默认导入、命名导入、命名重导出、`export * as name` 和静态字符串动态导入。普通 `export * from "module"` 无法安全枚举全局对象，会明确报错。

### 构建信息

```ts
buildInfo({
	fileName: "meta/build-info.json",
	data: ({ mode }) => ({ channel: mode === "production" ? "stable" : "preview" }),
});
```

构建后可请求 `/meta/build-info.json`；开发服务器默认提供同名端点。源码中也可以导入 `virtual:fast-vite/build-info`，对应类型声明示例见 [API 文档](./docs/API.zh-CN.md)。

### 生产质量门禁

```ts
export default defineConfig({
	plugins: [
		subresourceIntegrity({ algorithms: "sha384", manifest: true }),
		bundleBudget({
			budgets: [
				{ name: "单个 JS", filter: /\.js$/, limit: 250 * 1024, requireMatch: true },
				{ name: "CSS 总量", filter: /\.css$/, limit: 50 * 1024, mode: "gzip", scope: "total" },
			],
		}),
		compression({ algorithms: ["gzip", "brotli"] }),
	],
});
```

同时使用这些插件时，应保持 `subresourceIntegrity` → `bundleBudget` → `compression` 的顺序。

### 外部配置变更重启

```ts
devRestart({
	paths: ["schema", "config/features.json"],
	debounce: 100,
});
```

用于 Vite 模块图之外但会影响插件初始化的配置或生成输入。Vite 已原生处理 `vite.config` 和 `.env`，无需重复监听。

## 安全与部署提示

- `svgIcons` 会通过 `innerHTML` 渲染 SVG 内部标记，扫描目录只能包含受信任的仓库资源。
- SRI 插件只计算本次构建的本地资源；远程 CDN 仍需固定版本，并单独配置 CSP 与 integrity 元数据。
- 预压缩插件只生成 `.gz` / `.br` 文件，Web 服务器或对象存储仍需按 `Accept-Encoding` 正确返回资源。
- 本仓库发布的是 npm 库，不是可直接部署的网站；应用部署的是消费项目构建得到的 `dist/`。

## 文档

- [完整 API 参考](./docs/API.zh-CN.md)
- [风险指南](./docs/RISKS.zh-CN.md)
- [拉取、开发、发布与部署](./docs/DEVELOPMENT_RELEASE_DEPLOY.zh-CN.md)
- [贡献指南](./CONTRIBUTING.md)
- [工程质量审查](./docs/ENGINEERING_REVIEW.zh-CN.md)
- [更新日志](./CHANGELOG.md)
- [安全策略](./SECURITY.md)

## 本地开发

```bash
pnpm install --frozen-lockfile
pnpm check
```

修改插件时可使用 `pnpm dev` 启动长期运行的 tsdown 监听构建。

`check` 会固定执行 tsdown 构建、源码类型检查、发布声明消费者测试、ESLint、Prettier、运行时与真实 Vite 集成测试，以及公共 API、ESM-only 和归档契约测试。仓库根目录就是公开 npm 包；`pnpm build` 只写入根目录下被忽略的 `dist/`，打包和发布也从仓库根目录执行。

## 许可证

[Apache-2.0](./LICENSE)
