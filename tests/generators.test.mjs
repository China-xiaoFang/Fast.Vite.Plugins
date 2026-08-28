import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdir, mkdtemp, readFile, rmdir, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { componentRegistry, routerMeta, svgIcons } from "../dist/index.mjs";

const workspaceRoot = process.cwd();

function configure(plugin, root, logger = { error: assert.fail, warn: assert.fail }) {
	plugin.configResolved({ logger, root });
	return plugin;
}

test("component, router and SVG generators expose their behavior through plugin hooks", async () => {
	const root = await mkdtemp(path.join(tmpdir(), "fast-vite-generators-"));
	const componentsDirectory = path.join(root, "components");
	const formDirectory = path.join(componentsDirectory, "form");
	const viewsDirectory = path.join(root, "views");
	const iconsDirectory = path.join(root, "icons");
	await mkdir(formDirectory, { recursive: true });
	await mkdir(viewsDirectory);
	await mkdir(iconsDirectory);
	await writeFile(path.join(componentsDirectory, "base-button.vue"), "<template><button /></template>");
	await writeFile(path.join(formDirectory, "index.vue"), "<template><form /></template>");
	await writeFile(
		path.join(componentsDirectory, "fast-table.tsx"),
		'import { defineComponent } from "vue"; export default defineComponent({ name: "FastTable", render: () => null });'
	);
	await writeFile(
		path.join(componentsDirectory, "generic-list.vue"),
		'<script setup lang="ts" generic="T">defineOptions({ name: "GenericList" });</script>'
	);
	await writeFile(path.join(componentsDirectory, "plain-card.tsx"), "// defineComponent({ name: 'Ignored' })\nexport default () => null;");
	await writeFile(
		path.join(componentsDirectory, "unnamed-table.tsx"),
		'import { defineComponent } from "vue"; export default defineComponent({ render: () => null });'
	);
	await writeFile(
		path.join(viewsDirectory, "home.vue"),
		String.raw`// defineOptions({ name: "CommentName" })
defineOptions({ title: "name: \"StringName\"", nested: { name: "NestedName" }, name: "HomePage" });`
	);
	await writeFile(
		path.join(viewsDirectory, "plain.vue"),
		'// defineOptions({ name: "CommentName" })\ndefineOptions({ enabled: true }); const later = { name: "LaterName" };'
	);
	await writeFile(path.join(iconsDirectory, "add.svg"), '<svg width="24" height="24"><path fill="currentColor" /></svg>');

	const registryFile = path.join(root, "generated/components.ts");
	const declarationsFile = path.join(root, "generated/components.d.ts");
	const routesFile = path.join(root, "generated/routes.json");
	const iconsFile = path.join(root, "generated/icons.ts");
	const warnings = [];
	try {
		await configure(componentRegistry({ dirs: "components", output: "generated/components.ts", dts: "generated/components.d.ts" }), root, {
			error: assert.fail,
			warn: (message) => warnings.push(message),
		}).buildStart();
		const registry = await readFile(registryFile, "utf8");
		const declarations = await readFile(declarationsFile, "utf8");
		assert.match(registry, /app\.component\(BaseButton\.name \?\? "BaseButton", BaseButton\)/);
		assert.match(registry, /app\.component\(Form\.name \?\? "Form", Form\)/);
		assert.doesNotMatch(registry, /hasComponentName/);
		assert.match(registry, /export type BaseButtonInstance = InstanceType<typeof BaseButton>/);
		assert.match(registry, /export type FastTableInstance = InstanceType<typeof FastTable>/);
		assert.match(registry, /export type FormInstance = InstanceType<typeof Form>/);
		assert.match(registry, /export type GenericListInstance = InstanceType<typeof GenericList>/);
		assert.match(registry, /export type PlainCardInstance = InstanceType<typeof PlainCard>/);
		assert.match(registry, /export type UnnamedTableInstance = InstanceType<typeof UnnamedTable>/);
		assert.doesNotMatch(registry, /@ts-nocheck/);
		assert.equal(warnings.length, 3);
		assert.ok(warnings.some((message) => /base-button\.vue/.test(message) && /"BaseButton"/.test(message)));
		assert.ok(warnings.some((message) => /form\/index\.vue/.test(message) && /"Form"/.test(message)));
		assert.ok(warnings.some((message) => /unnamed-table\.tsx/.test(message) && /"UnnamedTable"/.test(message)));
		assert.match(declarations, /declare module "vue"/);
		assert.match(declarations, /BaseButton:/);

		await configure(routerMeta({ dir: "views", output: "generated/routes.json" }), root).buildStart();
		assert.deepEqual(JSON.parse(await readFile(routesFile, "utf8")), {
			"/views/home.vue": "HomePage",
			"/views/plain.vue": "Plain",
		});

		await configure(svgIcons({ dir: "icons", output: "generated/icons.ts", removeDimensions: true }), root).buildStart();
		const iconModule = await readFile(iconsFile, "utf8");
		assert.match(iconModule, /export const AddIcon/);
		assert.match(iconModule, /"viewBox":"0 0 24 24"/);
		assert.doesNotMatch(iconModule, /"width"/);
		assert.match(iconModule, /h\("svg"/);
	} finally {
		await unlink(registryFile);
		await unlink(declarationsFile);
		await unlink(routesFile);
		await unlink(iconsFile);
		await unlink(path.join(componentsDirectory, "base-button.vue"));
		await unlink(path.join(componentsDirectory, "fast-table.tsx"));
		await unlink(path.join(componentsDirectory, "generic-list.vue"));
		await unlink(path.join(componentsDirectory, "plain-card.tsx"));
		await unlink(path.join(componentsDirectory, "unnamed-table.tsx"));
		await unlink(path.join(formDirectory, "index.vue"));
		await unlink(path.join(viewsDirectory, "home.vue"));
		await unlink(path.join(viewsDirectory, "plain.vue"));
		await unlink(path.join(iconsDirectory, "add.svg"));
		await rmdir(formDirectory);
		await rmdir(componentsDirectory);
		await rmdir(viewsDirectory);
		await rmdir(iconsDirectory);
		await rmdir(path.join(root, "generated"));
		await rmdir(root);
	}
});

test("generator plugins reject conflicts, unsupported outputs and paths outside root", async () => {
	assert.throws(() => componentRegistry({ output: "types/components.d.ts", dts: "types/components.d.ts" }), /不能指向同一文件/);
	assert.throws(() => componentRegistry({ output: "src/components.js" }), /TypeScript/);
	assert.throws(() => componentRegistry({ dts: "types/components.ts" }), /\.d\.ts/);
	assert.throws(() => svgIcons({ output: "src/icons.js" }), /TypeScript/);

	const componentPlugin = configure(componentRegistry({ dirs: "tests/fixtures/components", output: "../components.ts" }), workspaceRoot);
	await assert.rejects(componentPlugin.buildStart(), /必须位于 Vite root 内/);
	const routerPlugin = configure(routerMeta({ dir: "tests/fixtures/views", output: "../routes.json" }), workspaceRoot);
	await assert.rejects(routerPlugin.buildStart(), /必须位于 Vite root 内/);

	const duplicatePlugin = configure(
		componentRegistry({ dirs: "tests/fixtures/components", output: "duplicate.generated.ts", dts: false, name: () => "Duplicate" }),
		workspaceRoot,
		{ error: assert.fail, warn: () => undefined }
	);
	await assert.rejects(duplicatePlugin.buildStart(), /组件名称冲突/);
});

test("generator watchers clean up when a middleware-mode server closes", () => {
	class FakeWatcher extends EventEmitter {
		add() {}
	}
	for (const plugin of [componentRegistry(), routerMeta(), svgIcons()]) {
		const watcher = new FakeWatcher();
		plugin.configResolved({ logger: { error: assert.fail }, root: workspaceRoot });
		plugin.configureServer({ httpServer: null, watcher });
		assert.ok(watcher.listenerCount("all") > 0);
		watcher.emit("close");
		assert.equal(watcher.listenerCount("all"), 0);
	}
});
