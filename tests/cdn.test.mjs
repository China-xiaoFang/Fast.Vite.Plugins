import assert from "node:assert/strict";
import { test } from "node:test";

import { cdnJsDelivrUrl, cdnUnpkgUrl, globalExpression, renderCdnUrl, resolveCdnModules, transformCdnImports } from "../dist/index.mjs";

test("CDN URL templates render consistently", () => {
	const data = { name: "vue", version: "3.5.0", path: "dist/vue.global.prod.js" };
	assert.equal(renderCdnUrl(cdnJsDelivrUrl, data), "https://cdn.jsdelivr.net/npm/vue@3.5.0/dist/vue.global.prod.js");
	assert.equal(renderCdnUrl(cdnUnpkgUrl, data), "https://unpkg.com/vue@3.5.0/dist/vue.global.prod.js");
	assert.equal(renderCdnUrl(cdnJsDelivrUrl, { ...data, path: "https://example.com/vue.js" }), "https://example.com/vue.js");
	assert.throws(() => renderCdnUrl(cdnJsDelivrUrl, { ...data, version: "" }), /无法确定/);
});

test("global names are validated and converted to globalThis access", () => {
	assert.equal(globalExpression("ReactDOM.client"), 'globalThis["ReactDOM"]["client"]');
	assert.throws(() => globalExpression("window.alert()"), /非法/);
});

test("CDN import transformation uses AST boundaries for static and dynamic imports", () => {
	const code = 'import Vue, { ref as vueRef } from "vue";\nconst lazy = import("vue");';
	const importEnd = code.indexOf(";") + 1;
	const dynamicStart = code.lastIndexOf("import(");
	const dynamicEnd = dynamicStart + 'import("vue")'.length;
	const program = {
		body: [
			{
				type: "ImportDeclaration",
				start: 0,
				end: importEnd,
				source: { value: "vue" },
				specifiers: [
					{ type: "ImportDefaultSpecifier", start: 7, end: 10, local: { name: "Vue" } },
					{ type: "ImportSpecifier", start: 14, end: 27, imported: { name: "ref" }, local: { name: "vueRef" } },
				],
			},
			{
				type: "VariableDeclaration",
				start: importEnd + 1,
				end: code.length,
				declarations: [
					{
						type: "VariableDeclarator",
						start: code.indexOf("lazy"),
						end: dynamicEnd,
						init: { type: "ImportExpression", start: dynamicStart, end: dynamicEnd, source: { value: "vue" } },
					},
				],
			},
		],
	};

	const result = transformCdnImports(code, { vue: "Vue" }, program);
	assert.match(result.code, /const Vue = globalThis\["Vue"\]/);
	assert.match(result.code, /const vueRef = globalThis\["Vue"\]\["ref"\]/);
	assert.match(result.code, /Promise\.resolve\(globalThis\["Vue"\]\)/);
});

test("CDN modules resolve explicit versions and preserve dependency order", async () => {
	const modules = await resolveCdnModules(
		process.cwd(),
		{
			modules: [
				{ name: "vue", global: "Vue", version: "3.5.0", js: "dist/vue.global.prod.js" },
				{ name: "dayjs", global: "dayjs", version: "1.11.0", js: ["dayjs.min.js"], css: "theme.css" },
			],
		},
		{ command: "build", mode: "production" }
	);
	assert.deepEqual(
		modules.map(({ name }) => name),
		["vue", "dayjs"]
	);
	assert.equal(modules[1].cssUrls[0], "https://cdn.jsdelivr.net/npm/dayjs@1.11.0/theme.css");
});
