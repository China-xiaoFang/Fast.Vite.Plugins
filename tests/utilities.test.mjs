import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { brotliDecompressSync, gunzipSync } from "node:zlib";

import {
	compressContent,
	createBuildInfoPlugin,
	createBuildInformation,
	createCompressionPlugin,
	createVirtualModulesPlugin,
	replaceHtmlPlaceholders,
	validateEnvironment,
} from "../dist/index.mjs";

test("build information is deterministic with an injected clock", async () => {
	const info = await createBuildInformation(
		process.cwd(),
		{
			version: "2.0.0",
			commit: "abc123",
			data: { channel: "stable" },
			now: () => new Date("2026-01-02T03:04:05.000Z"),
		},
		{ command: "build", mode: "production" }
	);
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
	const gzip = await compressContent(source, "gzip");
	const brotli = await compressContent(source, "brotli");
	assert.deepEqual(gunzipSync(gzip), source);
	assert.deepEqual(brotliDecompressSync(brotli), source);
});

test("environment guard reports all invalid variables without exposing their values", () => {
	const issues = validateEnvironment(
		{
			VITE_API_URL: { pattern: /^https:\/\// },
			VITE_STAGE: { values: ["development", "production"] },
			OPTIONAL: { required: false },
		},
		{ VITE_API_URL: "not-a-url", VITE_STAGE: "preview" }
	);
	assert.deepEqual(
		issues.map(({ key }) => key),
		["VITE_API_URL", "VITE_STAGE"]
	);
	assert.doesNotMatch(JSON.stringify(issues), /not-a-url|preview/);
});

test("HTML template replacement escapes values and keeps unknown placeholders", () => {
	const html = replaceHtmlPlaceholders("<title>{{ TITLE }}</title><p>{{ UNKNOWN }}</p>", { TITLE: "A & <B>" });
	assert.equal(html, "<title>A &amp; &lt;B&gt;</title><p>{{ UNKNOWN }}</p>");
	assert.equal(replaceHtmlPlaceholders("{{ TITLE }}", Object.create({ TITLE: "inherited" })), "{{ TITLE }}");
});

test("virtual modules resolve sync and async sources", async () => {
	const plugin = createVirtualModulesPlugin({
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

test("plugin factories reject empty or unsafe configuration", () => {
	assert.throws(() => createBuildInfoPlugin({ virtualModuleId: "build-info" }), /必须以 virtual:/);
	assert.throws(() => createBuildInfoPlugin({ fileName: "." }), /相对路径/);
	assert.throws(() => createCompressionPlugin({ threshold: Number.POSITIVE_INFINITY }), /有限数值/);
	assert.throws(() => createVirtualModulesPlugin({ modules: {} }), /至少需要一个模块/);
});

test("published package exposes an ESM-only v2 contract", async () => {
	const manifest = JSON.parse(await readFile("package.json", "utf8"));
	assert.equal(manifest.name, "fast-vite-plugins");
	assert.equal(manifest.version, "2.0.0");
	assert.equal(manifest.private, undefined);
	assert.equal(manifest.publishConfig.access, "public");
	assert.equal(manifest.type, "module");
	assert.equal(manifest.exports["."].import, "./dist/index.mjs");
	assert.equal("require" in manifest.exports["."], false);
});
