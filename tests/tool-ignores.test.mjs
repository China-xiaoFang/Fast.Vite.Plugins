import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { getFileInfo } from "prettier";

const root = fileURLToPath(new URL("../", import.meta.url));
const ignoredPaths = [
	".agents/skills/example/SKILL.md",
	".agents/skills/example/check.ts",
	"packages/example/.agents/check.js",
	"skills-lock.json",
	"packages/example/skills-lock.json",
];
const maintainedPaths = ["AGENTS.md", "README.md", "src/index.ts"];

test("repository ESLint ignores root and nested skill files without hiding maintained files", async () => {
	const eslint = new ESLint({ cwd: root });
	for (const file of ignoredPaths) {
		assert.equal(await eslint.isPathIgnored(path.join(root, file)), true, file);
	}
	for (const file of maintainedPaths) {
		assert.equal(await eslint.isPathIgnored(path.join(root, file)), false, file);
	}
});

test("Prettier independently ignores skill files and retains repository documentation", async () => {
	const options = { ignorePath: path.join(root, ".prettierignore"), resolveConfig: false };
	for (const file of ignoredPaths) {
		assert.equal((await getFileInfo(path.join(root, file), options)).ignored, true, file);
	}
	for (const file of maintainedPaths) {
		assert.equal((await getFileInfo(path.join(root, file), options)).ignored, false, file);
	}
});
