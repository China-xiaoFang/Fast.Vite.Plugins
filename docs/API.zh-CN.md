# API 参考

本文档对应 `fast-vite-plugins@2.0.1`。包为 ESM-only；所有相对路径默认以 Vite `root` 为基准。生成器采用稳定排序、内容未变化时不写入，并拒绝将输出写到项目根目录之外。

## 入口与异常契约

包只提供一个公共模块入口，每个插件只导出一个函数，并导出配置这些插件所需的选项与回调类型。扫描、渲染、转换、测量等实现辅助函数均保持内部使用。

组合使用时必须保持 `subresourceIntegrity` → `bundleBudget` → `compression`，配置解析阶段会主动诊断逆序。部署与信任边界见[风险指南](./RISKS.zh-CN.md)。

每个插件函数都应独立导入，并直接写入 Vite 的 `plugins` 数组；库不会隐式启用插件。同时使用 SRI、体积预算和预压缩时，应按该顺序排列，确保压缩后的 HTML 已包含最终 integrity 属性。

## `componentRegistry(options?)`

扫描 `.vue`、`.tsx`、`.jsx` 组件，生成命名导出、批量注册模块与 Vue 全局组件声明。

```ts
componentRegistry({
	dirs: ["src/components", "src/features"],
	output: "src/components/index.generated.ts",
	dts: "types/components.generated.d.ts",
	name: ({ defaultName, relativePath }) => (relativePath.startsWith("admin/") ? `Admin${defaultName}` : defaultName),
});
```

| 选项         | 类型                               | 默认值                                | 说明                   |
| ------------ | ---------------------------------- | ------------------------------------- | ---------------------- |
| `dirs`       | `string \| readonly string[]`      | `"src/components"`                    | 扫描目录               |
| `output`     | `string \| false`                  | `"src/components/index.generated.ts"` | 组件入口；`false` 关闭 |
| `dts`        | `string \| false`                  | `"types/components.generated.d.ts"`   | 全局类型；`false` 关闭 |
| `deep`       | `boolean`                          | `true`                                | 是否递归扫描           |
| `extensions` | `readonly string[]`                | `vue, tsx, jsx`                       | 可带或不带点号的扩展名 |
| `include`    | `(context) => boolean`             | -                                     | 返回 `false` 排除文件  |
| `name`       | `(context) => string`              | -                                     | 自定义组件名           |
| `conflict`   | `"error" \| "warn" \| "overwrite"` | `"error"`                             | 重名策略               |
| `debounce`   | `number`                           | `80`                                  | 开发监听防抖毫秒数     |

`index.vue` 默认使用父目录名称。名称必须是唯一且合法的 ECMAScript 标识符。`output` 和 `dts` 不能同时关闭。

## `routerMeta(options?)`

生成“页面文件路径 → 稳定组件名”JSON，适合 KeepAlive、权限元数据和路由缓存。

```ts
routerMeta({
	dir: "src/views",
	output: "src/router/routes.generated.json",
	key: ({ relativePath }) => `@/${relativePath}`,
});
```

| 选项         | 默认值                               | 说明                                                   |
| ------------ | ------------------------------------ | ------------------------------------------------------ |
| `dir`        | `"src/views"`                        | 页面目录                                               |
| `output`     | `"src/router/routes.generated.json"` | 输出 JSON                                              |
| `deep`       | `true`                               | 是否递归                                               |
| `extensions` | `vue, tsx, jsx`                      | 页面扩展名                                             |
| `include`    | -                                    | 页面过滤器                                             |
| `name`       | -                                    | 自定义名称；默认优先读取静态 `defineOptions({ name })` |
| `key`        | -                                    | 自定义 JSON 键；默认 `/<root 相对路径>`                |
| `indent`     | `2`                                  | 0 到 10 的 JSON 缩进                                   |
| `debounce`   | `80`                                 | 开发监听防抖毫秒数                                     |

只解析静态字符串形式的 `defineOptions({ name: "..." })`；动态表达式会回退到文件名。

## `svgIcons(options?)`

把 SVG 目录编译为单个 Vue 组件模块。组件通过 `h("svg")` 渲染，不要求 JSX 插件。

```ts
svgIcons({
	dir: "src/assets/icons",
	output: "src/icons/index.generated.ts",
	componentPrefix: "App",
	componentSuffix: "Icon",
	removeDimensions: true,
	defaultAttributes: { "aria-hidden": "true", focusable: false },
});
```

| 选项                | 默认值                           | 说明                            |
| ------------------- | -------------------------------- | ------------------------------- |
| `dir`               | `"src/assets/icons"`             | SVG 源目录                      |
| `output`            | `"src/icons/index.generated.ts"` | 单文件输出                      |
| `deep`              | `true`                           | 是否递归                        |
| `componentPrefix`   | `""`                             | 组件名前缀                      |
| `componentSuffix`   | `"Icon"`                         | 组件名后缀                      |
| `include` / `name`  | -                                | 文件过滤器 / 命名器             |
| `defaultAttributes` | `{}`                             | 默认根属性，源 SVG 同名属性优先 |
| `removeDimensions`  | `false`                          | 删除 `width` / `height`         |
| `debounce`          | `80`                             | 开发监听防抖毫秒数              |

SVG 内部标记会通过 `innerHTML` 写入。不要把用户上传或其他不可信 SVG 放入扫描目录。

## `cdnImport(options)`

向 HTML 注入 CDN CSS/JavaScript，并在转换阶段把配置模块的 ESM 引用替换为 `globalThis` 访问。

```ts
cdnImport({
	urlTemplate: "https://cdn.jsdelivr.net/npm/{name}@{version}/{path}",
	modules: {
		name: "react-dom",
		global: "ReactDOM",
		version: "19.0.0",
		js: "umd/react-dom.production.min.js",
		aliases: ["react-dom/client"],
	},
	crossorigin: "anonymous",
	dev: false,
});
```

### `CdnImportPluginOptions`

| 选项                                     | 默认值           | 说明                                               |
| ---------------------------------------- | ---------------- | -------------------------------------------------- |
| `modules`                                | 必填             | 单个模块、数组或按 Vite 环境返回模块的函数         |
| `urlTemplate`                            | jsDelivr         | `{name}`、`{version}`、`{path}` 模板               |
| `dev`                                    | `false`          | 开发服务器也使用 CDN                               |
| `resolveVersion`                         | `true`           | 从 `node_modules/<name>/package.json` 读取缺失版本 |
| `ssr`                                    | `false`          | SSR 也使用浏览器全局变量；通常不应开启             |
| `crossorigin`                            | `"anonymous"`    | 标签属性；`false` 不输出                           |
| `injectTo`                               | `"head-prepend"` | Vite HTML 注入位置                                 |
| `generateScriptTag` / `generateStyleTag` | -                | 自定义单个资源标签描述符                           |

### `CdnModule`

| 字段                                   | 说明                                   |
| -------------------------------------- | -------------------------------------- |
| `name`                                 | npm/import 模块名                      |
| `global`                               | 浏览器全局变量，支持 `ReactDOM.client` |
| `version`                              | 固定版本；省略时默认自动读取           |
| `js`                                   | JS 相对路径、完整 URL 或数组           |
| `css`                                  | CSS 相对路径、完整 URL 或数组          |
| `aliases`                              | 映射到相同全局变量的额外模块名         |
| `urlTemplate`                          | 当前模块专用 URL 模板                  |
| `scriptAttributes` / `styleAttributes` | 合并到标签的额外属性                   |

支持默认导入、命名导入、命名重导出、`export * as name` 和静态字符串动态导入。普通 `export * from` 会报错，因为无法安全地把动态全局对象枚举成静态 ESM 导出。

## `buildInfo(options?)`

```ts
buildInfo({
	fileName: "meta/build-info.json",
	commit: process.env.GITHUB_SHA,
	data: ({ mode }) => ({ channel: mode }),
});
```

| 选项              | 默认值                           | 说明                           |
| ----------------- | -------------------------------- | ------------------------------ |
| `version`         | package.json 版本                | 固定版本                       |
| `packageJson`     | `"package.json"`                 | 版本来源，相对于 Vite `root`   |
| `fileName`        | `"build-info.json"`              | 构建资产路径                   |
| `commit`          | 常见 CI 环境变量                 | 提交标识                       |
| `data`            | `{}`                             | JSON 自定义字段或异步提供者    |
| `dev`             | `true`                           | 开发服务器提供同名 JSON 端点   |
| `virtualModuleId` | `"virtual:fast-vite/build-info"` | 虚拟模块；`false` 关闭         |
| `now`             | `() => new Date()`               | 时间来源，用于可重复构建或测试 |

标准字段为 `version`、`builtAt`、`mode` 和可选 `commit`，始终覆盖自定义数据中的同名字段。插件不会改写 package.json 或 public 目录。

虚拟模块类型声明示例：

```ts
declare module "virtual:fast-vite/build-info" {
	export const version: string;
	const information: {
		version: string;
		builtAt: string;
		mode: string;
		commit?: string;
	};
	export default information;
}
```

## `subresourceIntegrity(options?)`

对最终本地 JavaScript/CSS 计算 Subresource Integrity 摘要，并更新 HTML 中的 script、stylesheet、preload 和 modulepreload 标签。

```ts
subresourceIntegrity({
	algorithms: ["sha384", "sha512"],
	crossorigin: "anonymous",
	manifest: "meta/integrity.json",
	strict: false,
});
```

| 选项          | 默认值            | 说明                                                          |
| ------------- | ----------------- | ------------------------------------------------------------- |
| `algorithms`  | `"sha384"`        | `sha256` / `sha384` / `sha512`，支持多个摘要                  |
| `filter`      | JavaScript 与 CSS | 正则或 `(fileName, type) => boolean`                          |
| `crossorigin` | `"anonymous"`     | `anonymous` / `use-credentials`；`false` 不自动添加           |
| `overwrite`   | `true`            | 更新本地标签已有的 integrity/crossorigin                      |
| `manifest`    | `false`           | `true` 输出 `integrity-manifest.json`，字符串指定安全相对路径 |
| `strict`      | `false`           | 本地脚本/样式无法对应 bundle 产物时中止构建                   |

完整 URL 只有在与绝对 `base` 同源且位于其路径下时才作为本地产物；其他远程资源不会被下载或计算。publicDir 文件不在 bundle 中，启用 `strict` 前应自行纳入构建图或单独处理。独立使用时必须把本插件放在预压缩插件之前。

## `bundleBudget(options)`

对最终产物执行可让 CI 失败的体积预算，补足 Vite 仅提供 chunk 告警、不能约束 CSS/总量/压缩体积的边界。

```ts
bundleBudget({
	budgets: [
		{ name: "单个入口 JS", filter: /\.js$/, limit: 250 * 1024, requireMatch: true },
		{ name: "CSS 总量", filter: /\.css$/, limit: 50 * 1024, mode: "gzip", scope: "total" },
	],
	onExceed: "error",
});
```

### `BundleBudgetRule`

| 字段           | 默认值                      | 说明                                        |
| -------------- | --------------------------- | ------------------------------------------- |
| `name`         | `budget-<序号>`             | 稳定诊断名称                                |
| `limit`        | 必填                        | 最大字节数，必须为大于或等于 0 的安全整数   |
| `scope`        | `"file"`                    | `file` 逐文件限制；`total` 计算匹配文件总和 |
| `mode`         | `"raw"`                     | `raw` / `gzip` / `brotli`                   |
| `filter`       | 排除 `.map` / `.gz` / `.br` | 正则或 `(fileName, type) => boolean`        |
| `requireMatch` | `false`                     | 没有匹配产物时失败，防止改名后预算静默失效  |

`onExceed` 默认 `error`；`warn` 适合临时观察，不适合作为 CI 质量门禁。gzip/Brotli 模式使用 Node.js 原生编码器实际压缩，不使用估算值。

## `devRestart(options)`

监听 Vite 模块图之外的配置、schema 或生成输入，在变化时防抖重启开发服务器。

```ts
devRestart({
	paths: ["schema", "config/features.json"],
	debounce: 100,
	beforeRestart: async ({ file, event }) => auditChange(file, event),
});
```

| 选项                | 默认值  | 说明                                        |
| ------------------- | ------- | ------------------------------------------- |
| `paths`             | 必填    | 相对 Vite root 或绝对文件/目录；不支持 glob |
| `debounce`          | `100`   | 合并连续文件事件的毫秒数                    |
| `forceOptimizeDeps` | `false` | 重启时是否强制重新执行依赖预构建            |
| `beforeRestart`     | -       | 重启前同步/异步钩子；抛错会取消本次重启     |
| `log`               | `true`  | 输出最后一次触发重启的相对路径              |

启动时存在的目录会匹配其后代；启动时不存在的路径按单个精确文件处理。Vite 已原生监听自己的配置和 `.env`，无需重复加入。

## `compression(options?)`

```ts
compression({
	algorithms: ["gzip", "brotli"],
	threshold: 10 * 1024,
	minRatio: 0.95,
});
```

| 选项                            | 默认值        | 说明                           |
| ------------------------------- | ------------- | ------------------------------ |
| `algorithms`                    | gzip + Brotli | 单个算法或算法数组             |
| `threshold`                     | `1024`        | 最小原始字节数                 |
| `minRatio`                      | `0.95`        | 输出压缩文件的最大体积比       |
| `filter`                        | 常见文本/wasm | 正则或函数过滤器               |
| `fileName`                      | `.gz` / `.br` | 自定义安全且不冲突的相对文件名 |
| `gzipOptions` / `brotliOptions` | Node 默认值   | 传给 `node:zlib` 的选项        |

生成文件后还需要服务器按 `Accept-Encoding` 提供对应资源。

## `staticCopy(options)`

```ts
staticCopy({
	targets: [
		{ src: "LICENSE", dest: "meta/LICENSE" },
		{
			src: "robots.template.txt",
			dest: "robots.txt",
			transform: (content) => content.toString("utf8").replaceAll("{{HOST}}", "example.com"),
		},
	],
	missing: "warn",
});
```

`dest` 始终相对于 Vite `outDir`，越界路径会被拒绝。`transform` 仅支持普通文件；目录通过 Node.js 原生递归复制处理。

## `virtualModules(options)`

```ts
virtualModules({
	modules: {
		"virtual:feature-flags": "export default { beta: false };",
		"virtual:build-mode": ({ mode }) => `export default ${JSON.stringify(mode)};`,
	},
});
```

模块 ID 必须以 `virtual:` 开头，源码必须是合法 ESM。插件不会猜测导出类型，消费项目需要自行提供 `declare module`。

## `envGuard(options)`

```ts
envGuard({
	schema: {
		VITE_API_URL: { pattern: /^https:\/\//, description: "HTTPS API base URL" },
		VITE_STAGE: { values: ["development", "production"] },
		OPTIONAL_TOKEN: { required: false },
	},
	onInvalid: "error",
});
```

规则支持 `required`、`allowEmpty`、`pattern`、`values` 和自定义 `validate`。诊断只包含变量名和失败原因，不会输出实际值。

## `htmlTemplate(options)`

```html
<title>{{ APP_TITLE }}</title>
```

```ts
htmlTemplate({
	data: ({ mode }) => ({ APP_TITLE: mode === "production" ? "Fast" : "Fast Dev" }),
	strict: true,
});
```

替换值默认进行 HTML 转义；未知占位符默认保留，`strict: true` 时会报错。只有完全可信且确实需要原始标记时才设置 `escape: false`。

## 类型

公开的选项和回调类型均具备 TSDoc，可在编辑器中直接查看默认值、选项交互、错误行为和安全约束。
