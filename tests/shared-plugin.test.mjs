import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { createDebouncedTask, onServerClose } from "../src/shared/plugin.ts";

test("debounced tasks route synchronous throws and asynchronous rejections to onError", async () => {
	for (const asynchronous of [false, true]) {
		const failure = new Error("task failed");
		const handled = Promise.withResolvers();
		const task = createDebouncedTask(
			() => {
				if (asynchronous) return Promise.reject(failure);
				throw failure;
			},
			0,
			handled.resolve
		);
		try {
			task();
			assert.equal(await handled.promise, failure);
		} finally {
			task.cancel();
		}
	}
});

test("debounced task cancellation discards pending work", async () => {
	let calls = 0;
	const task = createDebouncedTask(
		() => {
			calls++;
		},
		5,
		assert.fail
	);
	task();
	task.cancel();
	await delay(20);
	assert.equal(calls, 0);
});

test("running tasks never overlap and only the queued follow-up executes", async () => {
	let calls = 0;
	const entered = Promise.withResolvers();
	const release = Promise.withResolvers();
	const second = Promise.withResolvers();
	const task = createDebouncedTask(
		async () => {
			calls++;
			if (calls === 1) {
				entered.resolve();
				await release.promise;
			} else {
				second.resolve();
			}
		},
		0,
		second.reject
	);
	try {
		task();
		await entered.promise;
		task();
		task();
		await delay(15);
		assert.equal(calls, 1);
		release.resolve();
		await second.promise;
		assert.equal(calls, 2);
	} finally {
		release.resolve();
		task.cancel();
	}
});

test("server cleanup runs once and removes both event subscriptions", () => {
	const httpServer = new EventEmitter();
	const watcher = new EventEmitter();
	let calls = 0;
	onServerClose({ httpServer, watcher }, () => {
		calls++;
	});
	httpServer.emit("close");
	watcher.emit("close");
	assert.equal(calls, 1);
	assert.equal(httpServer.listenerCount("close"), 0);
	assert.equal(watcher.listenerCount("close"), 0);
});
