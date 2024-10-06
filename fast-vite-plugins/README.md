[中](https://gitee.com/China-xiaoFang/fast.vite.plugins) | **En**

<h1 align="center">Fast.Vite.Plugins</h1>

<p align="center">
  A plugin library for building projects based on <code>Vite</code>.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/fast-vite-plugins">
    <img src="https://img.shields.io/npm/v/fast-vite-plugins?color=orange&label=" alt="version" />
  </a>
  <a href="https://gitee.com/China-xiaoFang/fast.vite.plugins/blob/master/LICENSE">
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
import { defineConfig } from "vite";
import { buildSvgIcon, cdnImport, tsxComponentAutoImport, vueComponentAutoImport, versionUpdatePlugin } from "fast-vite-plugins";

export default defineConfig({
  plugins: [
    /** Building native SVG icons */
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
          path: "dist/vue.global.prod.min.js"
        },
        {
          name: "vue-router",
          var: "VueRouter",
          path: "4.2.2/dist/vue-router.global.prod.min.js"
        }
      ]
    }),
    /** Automatic import and export of TSX components */
    tsxComponentAutoImport("./src/components"),
    /** Automatic import and export of VUE components */
    vueComponentAutoImport("./src/components"),
    /** Package version number update */
    versionUpdatePlugin("1.0.0"),
  ]
})
```

## Update log

Update log [Click to view](https://gitee.com/China-xiaoFang/fast.vite.plugins/commits/master)

## Protocol

[Fast.Vite.Plugins](https://gitee.com/China-xiaoFang/fast.vite.plugins) complies with the [Apache-2.0](https://gitee.com/China-xiaoFang/fast.vite.plugins/blob/master/LICENSE) open source agreement. Welcome to submit `PR` or `Issue`.

```
Apache Open Source License

Copyright © 2018-Now xiaoFang

The right to deal in the Software is hereby granted free of charge to any person obtaining a copy of this software and its related documentation (the "Software"),
Including but not limited to using, copying, modifying, merging, publishing, distributing, sublicensing, selling copies of the Software,
and permit individuals in possession of a copy of the software to do so, subject to the following conditions:

The above copyright notice and this license notice must be included on all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS AND NON-INFRINGEMENT.
In no event shall the author or copyright holder be liable for any claim, damages or other liability,
WHETHER ARISING IN CONTRACT, TORT OR OTHERWISE, IN CONNECTION WITH THE SOFTWARE OR ITS USE OR OTHER DEALINGS.
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
