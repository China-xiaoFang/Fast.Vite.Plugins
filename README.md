<p align="left">
	<a href="./README.zh.md">简体中文</a> | <strong>English</strong>
</p>

<p align="center">
	<img src="./Fast.png" alt="logo" width="160" />
</p>

# fast-vite-plugins

An open-source collection of production-grade Vite plugins for modern Web applications, with consistent typed APIs, strict safety boundaries, tests, CI, and release validation.

[![npm](https://img.shields.io/npm/v/fast-vite-plugins)](https://www.npmjs.com/package/fast-vite-plugins) [![node](https://img.shields.io/badge/node-%5E22.18%20%7C%7C%20%5E24.18-brightgreen)](https://nodejs.org/) [![vite](https://img.shields.io/badge/vite-7%20%7C%7C%208-646cff)](https://vite.dev/) [![license](https://img.shields.io/npm/l/fast-vite-plugins)](./LICENSE)

## Highlights

- ESM-only package with Vite as its only peer dependency and no runtime dependencies.
- Web-application-first scope covering development, HTML, assets, security, observability, and production quality gates.
- One feature-named function per plugin: import and configure only what your project needs.
- Deterministic generators that avoid rewriting unchanged output.
- Output-boundary validation, debounced watchers, watcher cleanup, and clear conflict diagnostics.
- TypeScript 6 strict checks, type-aware ESLint 10, public API type tests, Node tests, and a real Vite build test.
- Vite 7 and 8 support on Node.js `^22.18.0 || ^24.18.0`.

## Plugins

| API                    | Purpose                                                 |
| ---------------------- | ------------------------------------------------------- |
| `componentRegistry`    | Generate a Vue component registry and global types      |
| `routerMeta`           | Generate a route-file to component-name JSON map        |
| `svgIcons`             | Generate typed Vue icon components from an SVG folder   |
| `cdnImport`            | Map ESM imports to CDN-provided browser globals         |
| `buildInfo`            | Emit build metadata, a dev endpoint, and virtual module |
| `bundleBudget`         | Enforce per-file or total raw/compressed size budgets   |
| `compression`          | Emit gzip and Brotli precompressed assets               |
| `subresourceIntegrity` | Inject SRI hashes for local JavaScript and CSS          |
| `devRestart`           | Restart dev when external configuration files change    |
| `staticCopy`           | Safely copy or transform build-time static assets       |
| `virtualModules`       | Declare static or dynamic virtual ESM modules           |
| `envGuard`             | Validate environment variables without logging values   |
| `htmlTemplate`         | Replace escaped HTML placeholders and inject tags       |

## Install

```bash
pnpm add -D fast-vite-plugins
```

The consuming project must use an ESM Vite configuration and Vite 7 or 8.

## Quick start

```ts
import { defineConfig } from "vite";

import { buildInfo, bundleBudget, compression, envGuard, subresourceIntegrity } from "fast-vite-plugins";

export default defineConfig({
	plugins: [
		envGuard({
			schema: { VITE_API_URL: { pattern: /^https:\/\// } },
		}),
		buildInfo(),
		subresourceIntegrity({ manifest: true }),
		bundleBudget({
			budgets: [
				{ name: "entry JavaScript", filter: /\.js$/, limit: 250 * 1024 },
				{ name: "all CSS (gzip)", filter: /\.css$/, limit: 50 * 1024, mode: "gzip", scope: "total" },
			],
		}),
		compression({ algorithms: ["gzip", "brotli"], threshold: 10 * 1024 }),
	],
});
```

Every plugin is imported and configured independently. The package does not enable implicit behavior.

```ts
import { buildInfo, htmlTemplate } from "fast-vite-plugins";

export default defineConfig({
	plugins: [htmlTemplate({ data: { APP_TITLE: "Fast Admin" }, strict: true }), buildInfo({ fileName: "meta/build-info.json" })],
});
```

## Common scenarios

### Component registry and types

```ts
componentRegistry({
	dirs: ["src/components", "src/features"],
	output: "src/components/index.generated.ts",
	dts: "types/components.generated.d.ts",
	conflict: "error",
});
```

The generated module provides named component exports, a `components` registry, and `registerComponents(app)`. An `index.vue` file uses its parent directory name by default; every generated name must be a unique JavaScript identifier.

### CDN externalization

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

The plugin supports default and named imports, named re-exports, `export * as name`, and static-string dynamic imports. Plain `export * from "module"` fails explicitly because a browser global cannot be enumerated safely at build time.

### Build information

```ts
buildInfo({
	fileName: "meta/build-info.json",
	data: ({ mode }) => ({ channel: mode === "production" ? "stable" : "preview" }),
});
```

The generated file is available at `/meta/build-info.json`; the development server exposes the same endpoint. Source code can also import `virtual:fast-vite/build-info`; see the [API reference](./docs/API.md) for its type declaration.

### Production quality gates

```ts
export default defineConfig({
	plugins: [
		subresourceIntegrity({ algorithms: "sha384", manifest: true }),
		bundleBudget({
			budgets: [
				{ name: "single JavaScript", filter: /\.js$/, limit: 250 * 1024, requireMatch: true },
				{ name: "all CSS", filter: /\.css$/, limit: 50 * 1024, mode: "gzip", scope: "total" },
			],
		}),
		compression({ algorithms: ["gzip", "brotli"] }),
	],
});
```

When these plugins are combined, keep the order `subresourceIntegrity` → `bundleBudget` → `compression`.

### External configuration restart

```ts
devRestart({
	paths: ["schema", "config/features.json"],
	debounce: 100,
});
```

Use `devRestart()` for configuration inputs outside Vite's module graph. Vite already restarts for its own config and `.env` files.

## Operational notes

- SVG internals are rendered with `innerHTML`; only scan trusted repository assets.
- The SRI plugin hashes local build outputs. Pin CDN versions and provide integrity metadata for remote CDN resources separately.
- Precompression emits `.gz` and `.br`; your server or object storage must serve them based on `Accept-Encoding`.
- When using SRI, budgets, and precompression together, keep this order in `plugins`: SRI → budgets → compression.
- This repository publishes an npm library. Deploy the consuming application's built `dist/`, not this repository.

## Documentation

- [Complete API reference](./docs/API.md)
- [Risk guide](./docs/RISKS.md)
- [Development, release, and deployment guide (Chinese)](./docs/DEVELOPMENT_RELEASE_DEPLOY.zh-CN.md)
- [Changelog](./CHANGELOG.md)
- [Security policy](./SECURITY.md)

## Development

```bash
pnpm install --frozen-lockfile
pnpm check
```

Use `pnpm dev` for a long-running tsdown watch build while editing plugins.

The repository root is the public npm package. `pnpm build` writes only to the ignored root `dist/` directory, and package inspection or publishing runs from the repository root with pnpm.

## License

[Apache-2.0](./LICENSE)
