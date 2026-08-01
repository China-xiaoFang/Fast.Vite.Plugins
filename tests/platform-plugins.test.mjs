import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import path from "node:path";
import { test } from "node:test";

import { build } from "vite";

import {
	createBundleBudgetPlugin,
	createDevRestartPlugin,
	createSubresourceIntegrity,
	evaluateBundleBudgets,
	injectSubresourceIntegrity,
	matchesWatchedPath,
} from "../dist/index.mjs";

test("bundle budgets evaluate per-file, total and missing-match rules", async () => {
	const results = await evaluateBundleBudgets(
		[
			{ fileName: "assets/app.js", source: "12345", type: "chunk" },
			{ fileName: "assets/app.css", source: "123", type: "asset" },
			{ fileName: "assets/app.js.map", source: "ignored", type: "asset" },
		],
		[
			{ name: "scripts", filter: /\.js$/, limit: 4 },
			{ name: "code", filter: /\.(?:css|js)$/, limit: 8, scope: "total" },
			{ name: "images", filter: /\.png$/, limit: 10, requireMatch: true },
		]
	);

	assert.deepEqual(
		results.map(({ actualBytes, exceeded, missingMatch, name }) => ({ actualBytes, exceeded, missingMatch, name })),
		[
			{ actualBytes: 5, exceeded: true, missingMatch: false, name: "scripts" },
			{ actualBytes: 8, exceeded: false, missingMatch: false, name: "code" },
			{ actualBytes: 0, exceeded: true, missingMatch: true, name: "images" },
		]
	);
});

test("new plugin factories reject ambiguous or unsafe configuration", () => {
	assert.throws(() => createBundleBudgetPlugin({ budgets: [] }), /budgets/);
	assert.throws(
		() =>
			createBundleBudgetPlugin({
				budgets: [
					{ limit: 1, name: "same" },
					{ limit: 2, name: "same" },
				],
			}),
		/不能重复/
	);
	assert.throws(() => createDevRestartPlugin({ paths: "schema/**/*.json" }), /glob/);
	assert.throws(() => createSubresourceIntegrity("content", []), /algorithms/);
});

test("bundle budget plugin can fail a real Vite Web application build", async () => {
	const root = path.resolve("tests/fixtures/integration");
	await assert.rejects(
		build({
			root,
			logLevel: "silent",
			plugins: [createBundleBudgetPlugin({ budgets: [{ filter: /\.js$/, limit: 1, requireMatch: true }] })],
			build: {
				minify: false,
				write: false,
			},
		}),
		/fast-vite:bundle-budget/
	);
});

test("SRI helpers hash local build assets without touching remote URLs", () => {
	const integrity = createSubresourceIntegrity("console.log('fast')", ["sha384", "sha512"]);
	const result = injectSubresourceIntegrity(
		'<script type="module" src="/app/assets/app.js?v=1"></script><link rel="stylesheet" href="./assets/app.css"><script src="https://other.example/app.js"></script>',
		{
			base: "/app/",
			htmlFileName: "index.html",
			integrities: { "assets/app.css": integrity, "assets/app.js": integrity },
		}
	);

	assert.match(integrity, /^sha384-[A-Za-z\d+/]+=* sha512-[A-Za-z\d+/]+=*$/);
	assert.equal(result.injected.length, 2);
	assert.deepEqual(result.missing, []);
	assert.equal((result.html.match(/ integrity=/g) ?? []).length, 2);
	assert.match(result.html, /https:\/\/other\.example\/app\.js/);
});

test("dev restart path matching handles exact files and directory descendants", () => {
	const directory = path.resolve("tests/fixtures");
	const file = path.resolve("package.json");
	assert.equal(matchesWatchedPath(path.join(directory, "integration/index.html"), [{ directory: true, path: directory }]), true);
	assert.equal(matchesWatchedPath(file, [{ directory: false, path: file }]), true);
	assert.equal(matchesWatchedPath(path.resolve("README.md"), [{ directory: false, path: file }]), false);
});

test("dev restart plugin debounces watched changes and runs its hook", async () => {
	class FakeWatcher extends EventEmitter {
		added = [];

		add(paths) {
			this.added.push(...paths);
		}
	}

	const watcher = new FakeWatcher();
	const restarts = [];
	const beforeRestart = [];
	const plugin = createDevRestartPlugin({
		paths: "tests/fixtures",
		debounce: 5,
		log: false,
		beforeRestart: (context) => beforeRestart.push(context),
	});
	const server = {
		config: { root: path.resolve("."), logger: { error: assert.fail, info: assert.fail } },
		restart: async (force) => restarts.push(force),
		watcher,
	};

	await plugin.configureServer(server);
	watcher.emit("all", "change", path.resolve("tests/fixtures/integration/index.html"));
	watcher.emit("all", "change", path.resolve("tests/fixtures/integration/src/main.js"));
	await new Promise((resolve) => setTimeout(resolve, 25));

	assert.deepEqual(restarts, [false]);
	assert.equal(beforeRestart.length, 1);
	assert.match(beforeRestart[0].file, /main\.js$/);
	plugin.buildEnd();
});
