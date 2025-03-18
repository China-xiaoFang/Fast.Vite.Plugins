**中** | [En](https://github.com/China-xiaoFang/fast.vite.plugins)

<h1 align="center">Fast.Vite.Plugins</h1>

<p align="center">
  一个基于 <code>Vite</code> 构建项目的插件库。
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/fast-vite-plugins">
    <img src="https://img.shields.io/npm/v/fast-vite-plugins?color=orange&label=" alt="version" />
  </a>
  <a href="https://gitee.com/China-xiaoFang/fast.vite.plugins/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/fast-vite-plugins" alt="license" />
  </a>
</p>

## 安装

```sh
# 选择一个你喜欢的包管理器

# NPM
npm install fast-vite-plugins -D

# Yarn
yarn add fast-vite-plugins -D

# pnpm（推荐）
pnpm install fast-vite-plugins -D
```

## 使用

在 `vite.config.ts`

```typescript
import { buildSvgIcon, cdnImport, tsxComponentAutoImport, versionUpdatePlugin, vueComponentAutoImport } from "fast-vite-plugins";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		/** 构建本地 SVG 图标，注意需要安装 @fast-china/utils 包 */
		buildSvgIcon("./src/assets/icons", "./src/icons"),
		/** CDN 导入 */
		cdnImport({
			// 开发环境使用 CDN 路径
			enableInDevMode: true,
			prodUrl: "https://cdn.jsdelivr.net/npm/{name}{version}/{path}",
			modules: [
				{
					name: "vue",
					var: "Vue",
					version: "3.4.27",
					path: "dist/vue.global.prod.min.js",
				},
				{
					name: "vue-router",
					var: "VueRouter",
					path: "4.2.2/dist/vue-router.global.prod.min.js",
				},
			],
		}),
		/** TSX 组件自动导入导出 */
		tsxComponentAutoImport("./src/components"),
		/** VUE 组件自动导入导出 */
		vueComponentAutoImport("./src/components"),
		/** 打包版本号更新 */
		versionUpdatePlugin("1.0.0"),
	],
});
```

## 更新日志

更新日志 [点击查看](https://gitee.com/China-xiaoFang/fast.vite.plugins/commits/master)

## 协议

[Fast.Vite.Plugins](https://gitee.com/China-xiaoFang/fast.vite.plugins) 遵循 [Apache-2.0](https://gitee.com/China-xiaoFang/fast.vite.plugins/blob/master/LICENSE) 开源协议，欢迎大家提交 `PR` 或 `Issue`。

```
Apache开源许可证

版权所有 © 2018-Now 小方

特此免费授予获得本软件及其相关文档文件（以下简称“软件”）副本的任何人以处理本软件的权利，
包括但不限于使用、复制、修改、合并、发布、分发、再许可、销售软件的副本，
以及允许拥有软件副本的个人进行上述行为，但须遵守以下条件：

在所有副本或重要部分的软件中必须包括上述版权声明和本许可声明。

软件按“原样”提供，不提供任何形式的明示或暗示的保证，包括但不限于对适销性、适用性和非侵权的保证。
在任何情况下，作者或版权持有人均不对任何索赔、损害或其他责任负责，
无论是因合同、侵权或其他方式引起的，与软件或其使用或其他交易有关。
```

## 免责申明

```
请勿用于违反我国法律的项目上
```

## 贡献者

感谢他们的所做的一切贡献！

<a href="https://github.com/China-xiaoFang/Fast.Vite.Plugins/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=China-xiaoFang/Fast.Vite.Plugins" />
</a>

## 补充说明

```
如果对您有帮助，您可以点右上角 ⭐Star 收藏一下 ，获取第一时间更新，谢谢！
```
