**中** | [En](https://github.com/China-xiaoFang/Fast.Vite.Plugins)

<h1 align="center">Fast.Vite.Plugins</h1>

<p align="center">
  一个基于 <code>Vite</code> 构建项目的插件库。
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/fast-vite-plugins">
    <img src="https://img.shields.io/npm/v/fast-vite-plugins?color=orange&label=" alt="version" />
  </a>
  <a href="https://gitee.com/FastDotnet/Fast.Vite.Plugins/blob/master/LICENSE">
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

更新日志 [点击查看](https://gitee.com/Fast.Vite.Plugins/commits/master)

## 协议

[Fast.Vite.Plugins](https://gitee.com/Fast.Vite.Plugins) 遵循 [Apache-2.0](https://gitee.com/Fast.Vite.Plugins/blob/master/LICENSE) 开源协议，欢迎大家提交 `PR` 或 `Issue`。

```
Apache开源许可证

版权所有 © 2018-Now 小方

许可授权：
本协议授予任何获得本软件及其相关文档（以下简称“软件”）副本的个人或组织。
在遵守本协议条款的前提下，享有使用、复制、修改、合并、发布、分发、再许可、销售软件副本的权利：
1.所有软件副本或主要部分必须保留本版权声明及本许可协议。
2.软件的使用、复制、修改或分发不得违反适用法律或侵犯他人合法权益。
3.修改或衍生作品须明确标注原作者及原软件出处。

特别声明：
- 本软件按“原样”提供，不提供任何形式的明示或暗示的保证，包括但不限于对适销性、适用性和非侵权的保证。
- 在任何情况下，作者或版权持有人均不对因使用或无法使用本软件导致的任何直接或间接损失的责任。
- 包括但不限于数据丢失、业务中断等情况。

免责条款：
禁止利用本软件从事危害国家安全、扰乱社会秩序或侵犯他人合法权益等违法活动。
对于基于本软件二次开发所引发的任何法律纠纷及责任，作者不承担任何责任。
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
