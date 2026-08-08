import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";

const expectedRootExports = [
	"buildInfo",
	"bundleBudget",
	"cdnImport",
	"cdnJsDelivrUrl",
	"cdnUnpkgUrl",
	"componentRegistry",
	"compression",
	"devRestart",
	"envGuard",
	"htmlTemplate",
	"routerMeta",
	"staticCopy",
	"subresourceIntegrity",
	"svgIcons",
	"virtualModules",
];

const semanticVersionPattern =
	/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[a-z-][0-9a-z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-z-][0-9a-z-]*))*)?(?:\+[0-9a-z-]+(?:\.[0-9a-z-]+)*)?$/i;

test("package metadata identifies a public ESM package", async () => {
	const manifest = JSON.parse(await readFile("package.json", "utf8"));
	assert.match(manifest.version, semanticVersionPattern);
	assert.equal(manifest.type, "module");
	assert.equal(manifest.sideEffects, false);
	assert.equal(manifest.publishConfig.access, "public");
	assert.ok(manifest.keywords.includes("fast"));
	assert.ok(manifest.keywords.includes("fast-china"));
	assert.ok(manifest.files.includes("dist"));
	assert.ok(!manifest.files.includes("src"));
});

test("root runtime API matches the explicit whitelist", async () => {
	const runtime = await import("fast-vite-plugins");
	assert.deepEqual(Object.keys(runtime).sort(), expectedRootExports.sort());
});

test("the public ESM entry imports successfully while CommonJS require fails", async () => {
	const manifest = JSON.parse(await readFile("package.json", "utf8"));
	for (const subpath of Object.keys(manifest.exports).filter((key) => key !== "./package.json")) {
		const specifier = subpath === "." ? manifest.name : `${manifest.name}/${subpath.slice(2)}`;
		await import(specifier);
	}
	const require = createRequire(import.meta.url);
	assert.throws(() => require("fast-vite-plugins"), /ERR_REQUIRE_ESM|No "exports" main defined|require\(\) of ES Module/);
});

test("dist contains only files reachable from exports and source maps resolve to published sources", async () => {
	const manifest = JSON.parse(await readFile("package.json", "utf8"));
	const allowed = new Set();
	const queue = [];
	for (const value of Object.values(manifest.exports)) {
		if (!value || typeof value === "string") continue;
		for (const target of [value.import, value.types]) {
			const fileName = target.replace(/^\.\/dist\//, "");
			allowed.add(fileName);
			if (fileName.endsWith(".mjs")) allowed.add(`${fileName}.map`);
			queue.push(fileName);
		}
	}

	while (queue.length > 0) {
		const fileName = queue.pop();
		const content = await readFile(path.join("dist", fileName), "utf8");
		for (const match of content.matchAll(/from\s+["']\.\/([^"']+\.mjs)["']/g)) {
			const imported = match[1];
			const resolved = fileName.endsWith(".d.mts") ? imported.replace(/\.mjs$/, ".d.mts") : imported;
			if (allowed.has(resolved)) continue;
			allowed.add(resolved);
			if (resolved.endsWith(".mjs")) allowed.add(`${resolved}.map`);
			queue.push(resolved);
		}
	}

	const actual = (await readdir("dist")).sort();
	assert.deepEqual(actual, [...allowed].sort());
	for (const mapName of actual.filter((fileName) => fileName.endsWith(".map"))) {
		assert.ok(!mapName.endsWith(".d.mts.map"), `unexpected declaration map: ${mapName}`);
		const map = JSON.parse(await readFile(path.join("dist", mapName), "utf8"));
		assert.equal(map.sources.length, map.sourcesContent?.length, mapName);
		assert.ok(
			map.sourcesContent.every((source) => typeof source === "string" && source.length > 0),
			mapName
		);
	}
});
