[中](https://gitee.com/FastDotnet/Fast.Vite.Plugins) | **En**

<h1 align="center">Fast.Vite.Plugins</h1>

<p align="center">
  <code>Fast</code> platform An plugin library built based on <code>Vite</code>.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/fast-vite-plugins">
    <img src="https://img.shields.io/npm/v/fast-vite-plugins?color=orange&label=" alt="version" />
  </a>
  <a href="https://gitee.com/FastDotnet/Fast.Vite.Plugins/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/fast-vite-plugins" alt="license" />
  </a>
</p>

## Install

```sh
# Choose a package manager of your choice

# NPM
npm install fast-vite-plugins -D

# Yarn
yarn add fast-vite-plugins -D

# pnpm (recommend)
pnpm install fast-vite-plugins -D
```

## Use

In `vite.config.ts`

```typescript
import { buildSvgIcon, cdnImport, tsxComponentAutoImport, versionUpdatePlugin, vueComponentAutoImport } from "fast-vite-plugins";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		/** Building native SVG icons, note that you need to install the @fast-china/utils package */
		buildSvgIcon("./src/assets/icons", "./src/icons"),
		/** CDN Import */
		cdnImport({
			// Development environment uses CDN path
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
		/** Automatic import and export of TSX components */
		tsxComponentAutoImport("./src/components"),
		/** Automatic import and export of VUE components */
		vueComponentAutoImport("./src/components"),
		/** Package version number update */
		versionUpdatePlugin("1.0.0"),
	],
});
```

## Update log

Update log [Click to view](https://gitee.com/FastDotnet/Fast.Vite.Plugins/commits/master)

## Protocol

[Fast.Vite.Plugins](https://gitee.com/FastDotnet/Fast.Vite.Plugins) complies with the [Apache-2.0](https://gitee.com/FastDotnet/Fast.Vite.Plugins/blob/master/LICENSE) open source agreement. Welcome to submit `PR` or `Issue`.

```
Apache Open Source License

Copyright © 2018-Now xiaoFang

License:
This Agreement grants any individual or organization that obtains a copy of this software and its related documentation (hereinafter referred to as the "Software").
Subject to the terms of this Agreement, you have the right to use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the Software:
1.All copies or major parts of the Software must retain this Copyright Notice and this License Agreement.
2.The use, copying, modification, or distribution of the Software shall not violate applicable laws or infringe upon the legitimate rights and interests of others.
3.Modified or derivative works must clearly indicate the original author and the source of the original Software.

Special Statement:
- This Software is provided "as is" without any express or implied warranty of any kind, including but not limited to the warranty of merchantability, fitness for purpose, and non-infringement.
- In no event shall the author or copyright holder be liable for any direct or indirect loss caused by the use or inability to use this Software.
- Including but not limited to data loss, business interruption, etc.

Disclaimer:
It is prohibited to use this software to engage in illegal activities such as endangering national security, disrupting social order, or infringing on the legitimate rights and interests of others.
The author does not assume any responsibility for any legal disputes and liabilities caused by the secondary development of this software.
```

## Disclaimer

```
Please do not use it for projects that violate our country's laws
```

## Contributors

Thank you for all their contributions!

<a href="https://github.com/China-xiaoFang/Fast.Vite.Plugins/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=China-xiaoFang/Fast.Vite.Plugins" />
</a>

## Supplementary instructions

```
If it is helpful to you, you can click ⭐Star in the upper right corner to collect it and get the latest updates. Thank you!
```
