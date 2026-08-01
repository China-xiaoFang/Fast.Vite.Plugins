# API reference

This document covers `fast-vite-plugins@2.0.0`. The package is ESM-only. Relative paths are resolved from Vite's `root`; generators sort output deterministically, skip unchanged writes, and reject output outside that root.

Import each factory directly and list it in Vite's `plugins` array. No plugin is enabled implicitly. When SRI, bundle budgets, and precompression are used together, list them in that order so compressed HTML is derived from the integrity-injected source.

## `createComponentRegistryPlugin(options?)`

Scans Vue/TSX/JSX files and generates named exports, a read-only registry, `registerComponents(app)`, and Vue `GlobalComponents` declarations.

```ts
createComponentRegistryPlugin({
	dirs: ["src/components", "src/features"],
	output: "src/components/index.generated.ts",
	dts: "types/components.generated.d.ts",
	conflict: "error",
});
```

Defaults: `dirs: "src/components"`, `output: "src/components/index.generated.ts"`, `dts: "types/components.generated.d.ts"`, recursive scanning, `vue/tsx/jsx`, conflict errors, and an 80 ms watcher debounce. `index.vue` uses its parent folder name. Names must be unique ECMAScript identifiers.

## `createRouterMetaPlugin(options?)`

Generates a stable JSON map from page file paths to component names. It recognizes static `defineOptions({ name: "..." })` and otherwise uses the file name.

Defaults: `dir: "src/views"`, `output: "src/router/routes.generated.json"`, recursive `vue/tsx/jsx` scanning, two-space JSON indentation, and an 80 ms debounce.

## `createSvgIconsPlugin(options?)`

Generates one Vue module from an SVG folder without requiring JSX support.

```ts
createSvgIconsPlugin({
	dir: "src/assets/icons",
	output: "src/icons/index.generated.ts",
	componentSuffix: "Icon",
	removeDimensions: true,
});
```

SVG internals are assigned through `innerHTML`; only scan trusted repository assets.

## `createCdnImportPlugin(options)`

Injects CDN resources and maps configured ESM imports to `globalThis` expressions.

```ts
createCdnImportPlugin({
	modules: {
		name: "vue",
		global: "Vue",
		version: "3.5.0",
		js: "dist/vue.global.prod.js",
	},
	dev: false,
});
```

`modules` accepts one module, an ordered array, or environment-aware resolvers. Each module configures `name`, `global`, `version`, `js`, optional `css`, aliases, per-module URL templates, and tag attributes. The plugin supports default/named imports, named re-exports, `export * as name`, and static dynamic imports. Plain `export * from` is rejected because a browser global cannot be safely enumerated as static ESM exports.

## `createBuildInfoPlugin(options?)`

Emits JSON metadata, serves the same endpoint in development, and exposes `virtual:fast-vite/build-info` by default.

```ts
createBuildInfoPlugin({
	fileName: "meta/build-info.json",
	data: ({ mode }) => ({ channel: mode }),
});
```

The standard fields are `version`, `builtAt`, `mode`, and optional `commit`. Version defaults to the root package manifest. The plugin never mutates package.json or the public directory.

## `createSubresourceIntegrityPlugin(options?)`

Hashes final local JavaScript/CSS outputs, injects `integrity` and `crossorigin` into HTML script, stylesheet, preload, and modulepreload tags, and can emit a deterministic manifest.

```ts
createSubresourceIntegrityPlugin({
	algorithms: "sha384",
	crossorigin: "anonymous",
	manifest: "meta/integrity.json",
	strict: false,
});
```

Defaults: SHA-384, JavaScript/CSS assets, `crossorigin="anonymous"`, overwrite stale local attributes, no manifest, and non-strict missing-resource handling. Remote URLs are never downloaded or hashed. `strict: true` is useful when every local script/style is part of the build graph, but publicDir assets are not present in the output bundle and must be handled separately.

When factories are listed independently, place this plugin before `createCompressionPlugin` so precompressed HTML contains the final integrity attributes.

## `createBundleBudgetPlugin(options)`

Enforces deterministic build-size limits in CI. Each rule supports per-file or aggregate scope, raw/gzip/Brotli measurement, regex/function filters, and optional no-match failure.

```ts
createBundleBudgetPlugin({
	budgets: [
		{ name: "entry JS", filter: /\.js$/, limit: 250 * 1024, requireMatch: true },
		{ name: "all CSS", filter: /\.css$/, limit: 50 * 1024, mode: "gzip", scope: "total" },
	],
	onExceed: "error",
});
```

`limit` is bytes. Defaults: `scope: "file"`, `mode: "raw"`, all outputs except source maps and precompressed files, `requireMatch: false`, and `onExceed: "error"`. Compressed modes run the actual Node.js codec rather than estimating. Use `onExceed: "warn"` only for an adoption period; CI quality gates should use the default error mode.

## `createDevRestartPlugin(options)`

Debounces a full development-server restart when external configuration or generator inputs change.

```ts
createDevRestartPlugin({
	paths: ["schema", "config/features.json"],
	debounce: 100,
	beforeRestart: async ({ file, event }) => auditChange(file, event),
});
```

Paths are resolved from Vite `root`; absolute paths are allowed for monorepos. Existing directories include descendants, while a path missing at startup is treated as one exact file. Globs are rejected to avoid Chokidar-version-dependent semantics. Defaults: 100 ms debounce, normal dependency optimization, and an informational restart log. Vite already watches its own config and `.env` files.

## `createCompressionPlugin(options?)`

Emits gzip and/or Brotli assets. Defaults: both algorithms, 1 KiB threshold, maximum ratio `0.95`, and common text/WebAssembly assets. The deployment server must still serve these files according to `Accept-Encoding`.

## `createStaticCopyPlugin(options)`

Copies files or directories after Vite writes the bundle. `dest` is always relative to `outDir`; escaping it is rejected. A `transform` callback is supported for individual files.

## `createVirtualModulesPlugin(options)`

```ts
createVirtualModulesPlugin({
	modules: {
		"virtual:flags": "export default { beta: false };",
		"virtual:mode": ({ mode }) => `export default ${JSON.stringify(mode)};`,
	},
});
```

Every ID must start with `virtual:` and every source must be valid ESM. Add matching ambient `declare module` definitions in the consuming project.

## `createEnvGuardPlugin(options)`

Validates required values, emptiness, regular expressions, allow-lists, and custom validators before Vite starts or builds. Diagnostics contain names and reasons, never actual environment values.

## `createHtmlTemplatePlugin(options)`

Replaces `{{ NAME }}` placeholders and injects Vite `HtmlTagDescriptor` values. Replacements are HTML-escaped by default. Unknown placeholders remain unless `strict: true` is enabled.

## Advanced helpers

The package also exports tested helpers for custom tooling: `scanComponents`, `renderComponentRegistry`, `renderComponentDts`, `extractComponentName`, `generateRouterMeta`, `parseSvg`, `scanSvgIcons`, `renderSvgIconModule`, `renderCdnUrl`, `globalExpression`, `transformCdnImports`, `resolveCdnModules`, `createBuildInformation`, `evaluateBundleBudgets`, `createSubresourceIntegrity`, `injectSubresourceIntegrity`, `matchesWatchedPath`, `compressContent`, `copyStaticTargets`, `validateEnvironment`, and `replaceHtmlPlaceholders`.

All public types include TSDoc for fields, defaults, error behavior, and security constraints.
