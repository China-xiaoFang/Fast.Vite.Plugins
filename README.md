# fast-vite-plugins

English | [简体中文](./README.zh.md)

An Apache-2.0 open-source collection of production-grade Vite plugins for modern Web applications. Version 2.0.0 provides consistent typed APIs, TypeScript 6, tsdown, strict safety boundaries, tests, CI, and release validation.

[![npm](https://img.shields.io/npm/v/fast-vite-plugins)](https://www.npmjs.com/package/fast-vite-plugins)
[![license](https://img.shields.io/npm/l/fast-vite-plugins)](./LICENSE)
[![node](https://img.shields.io/badge/node-%5E22.18%20%7C%7C%20%3E%3D24.11-brightgreen)](https://nodejs.org/)
[![vite](https://img.shields.io/badge/vite-8-646cff)](https://vite.dev/)

## Highlights

- ESM-only package with Vite as its only peer dependency and no runtime dependencies.
- Web-application-first scope covering development, HTML, assets, security, observability, and production quality gates.
- Independent `create...Plugin` factories: import and configure only the plugins your project needs.
- Deterministic generators that avoid rewriting unchanged output.
- Output-boundary validation, debounced watchers, watcher cleanup, and clear conflict diagnostics.
- TypeScript 6 strict checks, type-aware ESLint 10, public API type tests, Node tests, and a real Vite build test.
- Vite 8 support on Node.js `^22.18.0 || >=24.11.0`.

## Plugins

| API                                | Purpose                                                 |
| ---------------------------------- | ------------------------------------------------------- |
| `createComponentRegistryPlugin`    | Generate a Vue component registry and global types      |
| `createRouterMetaPlugin`           | Generate a route-file to component-name JSON map        |
| `createSvgIconsPlugin`             | Generate typed Vue icon components from an SVG folder   |
| `createCdnImportPlugin`            | Map ESM imports to CDN-provided browser globals         |
| `createBuildInfoPlugin`            | Emit build metadata, a dev endpoint, and virtual module |
| `createBundleBudgetPlugin`         | Enforce per-file or total raw/compressed size budgets   |
| `createCompressionPlugin`          | Emit gzip and Brotli precompressed assets               |
| `createSubresourceIntegrityPlugin` | Inject SRI hashes for local JavaScript and CSS          |
| `createDevRestartPlugin`           | Restart dev when external configuration files change    |
| `createStaticCopyPlugin`           | Safely copy or transform build-time static assets       |
| `createVirtualModulesPlugin`       | Declare static or dynamic virtual ESM modules           |
| `createEnvGuardPlugin`             | Validate environment variables without logging values   |
| `createHtmlTemplatePlugin`         | Replace escaped HTML placeholders and inject tags       |

## Install

```bash
pnpm add -D fast-vite-plugins
```

The consuming project must use an ESM Vite configuration and Vite 8.

## Quick start

```ts
import { defineConfig } from "vite";

import {
	createBuildInfoPlugin,
	createBundleBudgetPlugin,
	createCompressionPlugin,
	createEnvGuardPlugin,
	createSubresourceIntegrityPlugin,
} from "fast-vite-plugins";

export default defineConfig({
	plugins: [
		createEnvGuardPlugin({
			schema: { VITE_API_URL: { pattern: /^https:\/\// } },
		}),
		createBuildInfoPlugin(),
		createSubresourceIntegrityPlugin({ manifest: true }),
		createBundleBudgetPlugin({
			budgets: [
				{ name: "entry JavaScript", filter: /\.js$/, limit: 250 * 1024 },
				{ name: "all CSS (gzip)", filter: /\.css$/, limit: 50 * 1024, mode: "gzip", scope: "total" },
			],
		}),
		createCompressionPlugin({ algorithms: ["gzip", "brotli"], threshold: 10 * 1024 }),
	],
});
```

Every plugin is imported and configured independently. The package does not enable implicit behavior.

`createDevRestartPlugin()` covers configuration inputs outside Vite's module graph; Vite already restarts for its own config and `.env` files.

## Operational notes

- SVG internals are rendered with `innerHTML`; only scan trusted repository assets.
- The SRI plugin hashes local build outputs. Pin CDN versions and provide integrity metadata for remote CDN resources separately.
- Precompression emits `.gz` and `.br`; your server or object storage must serve them based on `Accept-Encoding`.
- When using SRI, budgets, and precompression together, keep this order in `plugins`: SRI → budgets → compression.
- This repository publishes an npm library. Deploy the consuming application's built `dist/`, not this repository.

## Documentation

- [Complete API reference](./docs/API.md)
- [Development, release, and deployment guide (Chinese)](./docs/DEVELOPMENT_RELEASE_DEPLOY.zh-CN.md)
- [Contributing](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)
- [Security policy](./SECURITY.md)

## Development

```bash
pnpm install --frozen-lockfile
pnpm check
```

The repository root is the public npm package. `pnpm build` writes only to the ignored root `dist/` directory, and `npm pack` or `npm publish` runs from the repository root.

## License

[Apache-2.0](./LICENSE)
