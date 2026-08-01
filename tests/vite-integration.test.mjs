import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { gunzipSync } from "node:zlib";

import { build } from "vite";

import {
	createBuildInfoPlugin,
	createCdnImportPlugin,
	createCompressionPlugin,
	createHtmlTemplatePlugin,
	createSubresourceIntegrityPlugin,
	createVirtualModulesPlugin,
} from "../dist/index.mjs";

test("plugins cooperate in a real Vite build", async () => {
	const result = await build({
		root: path.resolve("tests/fixtures/integration"),
		logLevel: "silent",
		plugins: [
			createVirtualModulesPlugin({
				modules: { "virtual:test-config": ({ mode }) => `export default { mode: ${JSON.stringify(mode)} };` },
			}),
			createHtmlTemplatePlugin({ data: { TITLE: "Integration & Test" } }),
			createCdnImportPlugin({
				modules: {
					name: "external-library",
					global: "ExternalLibrary",
					version: "1.0.0",
					js: "dist/index.min.js",
				},
			}),
			createBuildInfoPlugin({ version: "2.0.0", now: () => new Date("2026-01-02T03:04:05.000Z") }),
			createSubresourceIntegrityPlugin({ manifest: true, strict: true }),
			createCompressionPlugin({ algorithms: "gzip", threshold: 1, minRatio: 1 }),
		],
		build: {
			minify: false,
			write: false,
			rollupOptions: { output: { entryFileNames: "assets/app.js" } },
		},
	});

	assert.equal(Array.isArray(result), false);
	const output = result.output;
	const html = output.find((item) => item.type === "asset" && item.fileName === "index.html");
	const chunk = output.find((item) => item.type === "chunk" && item.isEntry);
	const buildInformation = output.find((item) => item.type === "asset" && item.fileName === "build-info.json");
	const integrityManifest = output.find((item) => item.type === "asset" && item.fileName === "integrity-manifest.json");
	const compressedHtml = output.find((item) => item.type === "asset" && item.fileName === "index.html.gz");

	assert.match(String(html.source), /Integration &amp; Test/);
	assert.match(String(html.source), /external-library@1\.0\.0/);
	assert.match(String(html.source), /integrity="sha384-[A-Za-z\d+/]+=*"/);
	assert.match(String(html.source), /crossorigin="anonymous"/);
	assert.match(chunk.code, /globalThis\["ExternalLibrary"\]/);
	assert.match(chunk.code, /production/);
	assert.match(String(buildInformation.source), /"version": "2\.0\.0"/);
	assert.match(String(integrityManifest.source), /"assets\/app\.js": "sha384-/);
	assert.equal(gunzipSync(Buffer.from(compressedHtml.source)).toString("utf8"), String(html.source));
	assert.ok(output.some((item) => item.type === "asset" && item.fileName.endsWith(".gz")));
});
