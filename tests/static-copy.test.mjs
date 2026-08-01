import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rmdir, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { copyStaticTargets } from "../dist/index.mjs";

test("static copy transforms files and blocks destinations outside outDir", async () => {
	const temporaryRoot = await mkdtemp(path.join(tmpdir(), "fast-vite-plugins-"));
	const sourceFile = path.join(temporaryRoot, "source.txt");
	const outDir = path.join(temporaryRoot, "dist");
	const destinationDirectory = path.join(outDir, "meta");
	const destinationFile = path.join(destinationDirectory, "copied.txt");
	await writeFile(sourceFile, "hello", "utf8");
	await mkdir(outDir);

	try {
		await copyStaticTargets(temporaryRoot, outDir, [
			{ src: "source.txt", dest: "meta/copied.txt", transform: (content) => content.toString("utf8").toUpperCase() },
		]);
		assert.equal(await readFile(destinationFile, "utf8"), "HELLO");
		await assert.rejects(copyStaticTargets(temporaryRoot, outDir, [{ src: "source.txt", dest: "../escape.txt" }]), /outDir/);
	} finally {
		await unlink(destinationFile);
		await unlink(sourceFile);
		await rmdir(destinationDirectory);
		await rmdir(outDir);
		await rmdir(temporaryRoot);
	}
});
