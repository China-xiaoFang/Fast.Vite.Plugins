import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { brotliDecompressSync, gunzipSync } from "node:zlib";

import { buildInfo, compression, envGuard, htmlTemplate, virtualModules } from "../dist/index.mjs";

test("build information is deterministic with an injected clock", async () => {
	const plugin = buildInfo({
		version: "2.0.0",
		commit: "abc123",
		data: { channel: "stable" },
		now: () => new Date("2026-01-02T03:04:05.000Z"),
	});
	plugin.config({}, { command: "build", mode: "production" });
	await plugin.configResolved({ root: process.cwd() });
	let emitted;
	await plugin.generateBundle.call({ emitFile: (asset) => (emitted = asset) });
	const info = JSON.parse(emitted.source);
	assert.deepEqual(info, {
		channel: "stable",
		version: "2.0.0",
		builtAt: "2026-01-02T03:04:05.000Z",
		mode: "production",
		commit: "abc123",
	});
});

test("compression produces valid gzip and brotli streams", async () => {
	const source = Buffer.from("fast-vite-plugins ".repeat(200));
	const plugin = compression({ threshold: 0, minRatio: 1 });
	plugin.configResolved({ plugins: [plugin] });
	const assets = [];
	await plugin.generateBundle.handler.call(
		{ emitFile: (asset) => assets.push(asset) },
		{},
		{ "app.js": { code: source.toString("utf8"), fileName: "app.js", type: "chunk" } }
	);
	assert.deepEqual(gunzipSync(assets.find(({ fileName }) => fileName.endsWith(".gz")).source), source);
	assert.deepEqual(brotliDecompressSync(assets.find(({ fileName }) => fileName.endsWith(".br")).source), source);
});

test("environment guard reports all invalid variables without exposing their values", () => {
	const plugin = envGuard({
		schema: {
			VITE_API_URL: { pattern: /^https:\/\// },
			VITE_STAGE: { values: ["development", "production"] },
			OPTIONAL: { required: false },
		},
	});
	const previousUrl = process.env.VITE_API_URL;
	const previousStage = process.env.VITE_STAGE;
	process.env.VITE_API_URL = "not-a-url";
	process.env.VITE_STAGE = "preview";
	try {
		assert.throws(
			() => plugin.config.call({ error: (message) => assert.fail(message) }, { envDir: false }, { mode: "test" }),
			(error) => /VITE_API_URL/.test(error.message) && /VITE_STAGE/.test(error.message) && !/not-a-url|preview/.test(error.message)
		);
	} finally {
		if (previousUrl === undefined) delete process.env.VITE_API_URL;
		else process.env.VITE_API_URL = previousUrl;
		if (previousStage === undefined) delete process.env.VITE_STAGE;
		else process.env.VITE_STAGE = previousStage;
	}
});

test("environment required and allowEmpty rules are independent", () => {
	const key = "FAST_VITE_EMPTY_TEST";
	const previous = process.env[key];
	try {
		delete process.env[key];
		assert.doesNotThrow(() => envGuard({ schema: { [key]: { required: false } } }).config.call({}, { envDir: false }, { mode: "test" }));
		process.env[key] = "";
		assert.throws(
			() =>
				envGuard({ schema: { [key]: { required: false } } }).config.call(
					{ error: (message) => assert.fail(message) },
					{ envDir: false },
					{ mode: "test" }
				),
			/变量为空/
		);
		assert.doesNotThrow(() => envGuard({ schema: { [key]: { allowEmpty: true } } }).config.call({}, { envDir: false }, { mode: "test" }));
	} finally {
		if (previous === undefined) delete process.env[key];
		else process.env[key] = previous;
	}
});

test("HTML template replacement escapes values and keeps unknown placeholders", () => {
	const plugin = htmlTemplate({ data: { TITLE: "A & <B>" } });
	plugin.config({}, { command: "build", mode: "production" });
	return plugin
		.transformIndexHtml("<title>{{ TITLE }}</title><p>{{ UNKNOWN }}</p>", { path: "/index.html" })
		.then(({ html }) => assert.equal(html, "<title>A &amp; &lt;B&gt;</title><p>{{ UNKNOWN }}</p>"));
});

test("virtual modules resolve sync and async sources", async () => {
	const plugin = virtualModules({
		modules: {
			"virtual:plain": "export default 1;",
			"virtual:mode": ({ mode }) => `export default ${JSON.stringify(mode)};`,
		},
	});
	plugin.config({}, { command: "build", mode: "test" });
	plugin.configResolved({ root: process.cwd() });
	const resolved = plugin.resolveId("virtual:mode");
	assert.match(resolved, /^\0fast-vite:virtual:/);
	assert.equal(await plugin.load(resolved), 'export default "test";');
});

test("plugin functions reject empty or unsafe configuration", () => {
	assert.throws(() => buildInfo({ virtualModuleId: "build-info" }), /必须以 virtual:/);
	assert.throws(() => buildInfo({ fileName: "." }), /相对路径/);
	assert.throws(() => compression({ threshold: Number.POSITIVE_INFINITY }), /有限数值/);
	assert.throws(() => virtualModules({ modules: {} }), /至少需要一个模块/);
});

test("published package exposes an ESM-only v2 contract", async () => {
	const manifest = JSON.parse(await readFile("package.json", "utf8"));
	assert.equal(manifest.name, "fast-vite-plugins");
	assert.equal(manifest.version, "2.0.1");
	assert.equal(manifest.private, undefined);
	assert.equal(manifest.publishConfig.access, "public");
	assert.equal(manifest.type, "module");
	assert.equal(manifest.exports["."].import, "./dist/index.mjs");
	assert.equal("require" in manifest.exports["."], false);
});
