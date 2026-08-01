import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";

import {
	extractComponentName,
	generateRouterMeta,
	parseSvg,
	renderComponentDts,
	renderComponentRegistry,
	renderSvgIconModule,
	scanComponents,
	scanSvgIcons,
} from "../dist/index.mjs";

const workspaceRoot = process.cwd();

test("component registry scans deterministically and renders valid entry files", async () => {
	const components = await scanComponents(workspaceRoot, { dirs: "tests/fixtures/components" });
	assert.deepEqual(
		components.map(({ name, relativePath }) => ({ name, relativePath })),
		[
			{ name: "BaseButton", relativePath: "base-button.vue" },
			{ name: "Form", relativePath: "form/index.vue" },
		]
	);

	const registry = renderComponentRegistry(path.join(workspaceRoot, "src/components/index.generated.ts"), components);
	assert.match(registry, /app\.component\("BaseButton", BaseButton\)/);
	assert.doesNotMatch(registry, /@ts-nocheck/);

	const declarations = renderComponentDts(path.join(workspaceRoot, "types/components.generated.d.ts"), components);
	assert.match(declarations, /declare module "vue"/);
	assert.match(declarations, /BaseButton:/);
});

test("component registry rejects duplicate component names", async () => {
	await assert.rejects(
		scanComponents(workspaceRoot, {
			dirs: "tests/fixtures/components",
			name: () => "Duplicate",
		}),
		/组件名称冲突/
	);
});

test("file generators reject output paths outside the Vite root", async () => {
	await assert.rejects(
		scanComponents(workspaceRoot, { dirs: "tests/fixtures/components", output: "../components.generated.ts" }),
		/必须位于 Vite root 内/
	);
	await assert.rejects(
		generateRouterMeta(workspaceRoot, { dir: "tests/fixtures/views", output: "../routes.generated.json" }),
		/必须位于 Vite root 内/
	);
});

test("component names support valid Unicode identifiers", async () => {
	const components = await scanComponents(workspaceRoot, {
		dirs: "tests/fixtures/components",
		include: ({ relativePath }) => relativePath === "base-button.vue",
		name: () => "按钮",
	});
	assert.equal(components[0].name, "按钮");
});

test("router metadata extracts defineOptions and emits stable root-relative paths", async () => {
	assert.equal(extractComponentName('defineOptions({ name: "DashboardPage" })'), "DashboardPage");
	const map = await generateRouterMeta(workspaceRoot, { dir: "tests/fixtures/views" });
	assert.deepEqual(map, { "/tests/fixtures/views/home.vue": "HomePage" });
});

test("SVG icons preserve SVG semantics and generate wrapper-free Vue components", async () => {
	const parsed = parseSvg('<svg width="16" height="12"><path fill="currentColor" /></svg>');
	assert.equal(parsed.attributes.viewBox, "0 0 16 12");
	assert.match(parsed.content, /currentColor/);

	const icons = await scanSvgIcons(workspaceRoot, { dir: "tests/fixtures/icons", removeDimensions: true });
	assert.equal(icons[0] && icons[0].name, "ActionsAddIcon");
	assert.equal(icons[0] && icons[0].attributes.width, undefined);
	assert.equal(icons[0] && icons[0].attributes.viewBox, "0 0 24 24");

	const moduleSource = renderSvgIconModule(icons);
	assert.match(moduleSource, /h\("svg"/);
	assert.doesNotMatch(moduleSource, /tsx/i);
});
