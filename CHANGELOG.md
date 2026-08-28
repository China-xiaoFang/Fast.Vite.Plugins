# Changelog

## Unreleased

## 2.0.8 - 2026-08-29

- Changed generated component registration to use each component's runtime `name`, with build warnings for statically detectable missing names and safe skipping when the runtime name is empty.
- Restored generated `NameInstance` exports for every scanned component.

## 2.0.7 - 2026-08-26

- Preserved the original missing-source filesystem error as the `cause` of strict static-copy failures.
- Simplified internal fallback naming and debounced task scheduling without changing the public plugin API.
- Synchronized the self-contained ESLint Flat Config with the applicable Fast.ESLint.Config source rules and comments, refreshed compatible development dependencies, and documented the VS Code recommendations.

## 2.0.6 - 2026-08-19

- Changed the default component registry outputs to `src/components/index.ts` and `types/components.d.ts`.
- Changed the default SVG icon module output to `src/icons/index.ts`.

## 2.0.5 - 2026-08-16

- Aligned the component registry, router metadata, and SVG icon source directories with their published plugin API names without changing the public API.

## 2.0.4 - 2026-08-09

- Added prioritized import path groups for the uni-app, Vue, Element Plus, Fast Element Plus, Fast China, and Lodash ecosystems while keeping type-only imports in the dedicated type group.
- Changed import group spacing to a compact no-blank-line style and normalized the repository imports to the new policy.

## 2.0.3 - 2026-08-08

- Added consistent `fast` and `fast-china` package keywords and completed the npm publish allowlist with contribution guidance.
- Removed `src` and declaration maps that referenced unpublished source files while retaining self-contained runtime source maps.
- Focused package-contract checks on public exports, ESM loading, publish contents, and runtime source-map integrity.

## 2.0.2 - 2026-08-04

- Standardize the bilingual README, repository ignores, editor recommendations, TypeScript configuration, and development workflow with the other Fast frontend SDK repositories.
- Rename the package contract test to `tests/package.test.mjs` and align package metadata with the canonical FastDotnet project URLs.
- Preserve the repository-local ESLint, sorting, and formatting implementation without introducing cross-repository dependencies.

## 2.0.1 - 2026-08-03

- Align Node.js, pnpm, CI, and Node type contracts with the 22.18/24.18 validation lines.
- Add a single explicit ESM entry, declaration maps, and exact package-content governance tests.
- Add regression coverage for CDN transforms and source maps, SRI HTML/path handling, lifecycle disposal, route-name scanning, runtime validation, multi-output static copy, and SRI → budget → compression ordering.
- Add public jsDelivr and unpkg URL templates, with jsDelivr remaining the default CDN provider.
- Support Vite 7 and 8 through the public peer dependency contract.
- Add English and Chinese risk guidance and clarify the release process.

All notable changes to this project are documented in this file.

## 2.0.0 - 2026-08-01

### Core

- One feature-named function per plugin with `...PluginOptions` public types.
- ESM-only `.mjs` output and `.d.mts` declarations with source maps.
- TypeScript 6, tsdown, ESLint 10, pnpm 11, and Node.js `^22.18.0 || >=24.11.0`.
- Vite 8 development and peer support.
- Consistent `fast-vite:<feature>` plugin names and diagnostics.

### Plugins

- Component registry, router metadata, SVG icons, CDN imports, build information, compression, static copy, virtual modules, environment validation, and HTML templates.
- Per-file or aggregate raw/gzip/Brotli bundle budgets with no-match enforcement.
- SHA-256/384/512 Subresource Integrity injection with an optional manifest.
- Debounced development-server restart for external configuration inputs.

### Quality and documentation

- Type-aware, self-contained ESLint flat config with documented project rules.
- Public API compilation tests, unit tests, real Vite Web application builds, and package archive checks.
- Output-root guards, strict option validation, stable generation, unchanged-write avoidance, and cancellable watcher tasks.
- Framework-level TSDoc for plugin options, contexts, results, defaults, error boundaries, and security-sensitive behavior.
- English and Chinese README/API documentation plus contribution, security, engineering review, and release guides.

### Publishing

- The repository root is the public `fast-vite-plugins` package.
- `pnpm build` writes ESM code, declarations, and source maps only to the root `dist/` directory.
- Pack and publish commands use the root package manifest directly; no duplicated manifest or synchronization script is maintained.
- CI validates Node.js 22.18/24.11, pnpm 11, Vite 8, and the final npm archive before release.
