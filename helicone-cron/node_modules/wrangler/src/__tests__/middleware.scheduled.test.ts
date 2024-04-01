import * as fs from "node:fs";
import { unstable_dev } from "../api";
import { runInTempDir } from "./helpers/run-in-tmp";

jest.unmock("undici");

describe("run scheduled events with middleware", () => {
	describe("module workers", () => {
		runInTempDir();

		beforeEach(() => {
			const scriptContent = `
			export default {
				fetch(request, env, ctx) {
					const url = new URL(request.url);
					if (url.pathname === "/__scheduled") {
						return new Response("Fetch triggered at /__scheduled");
					}
					return new Response("Hello world!");
				},
				scheduled(controller, env, ctx) {
					console.log("Doing something scheduled in modules...");
				},
			};
			`;
			fs.writeFileSync("index.js", scriptContent);
		});

		it("should not intercept when middleware is not enabled", async () => {
			const worker = await unstable_dev(
				"index.js",
				{},
				{ disableExperimentalWarning: true }
			);

			const resp = await worker.fetch("/__scheduled");
			let text;
			if (resp) text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"Fetch triggered at /__scheduled"`);
			await worker.stop();
		});

		it("should intercept when middleware is enabled", async () => {
			const worker = await unstable_dev(
				"index.js",
				{ testScheduled: true },
				{ disableExperimentalWarning: true }
			);

			const resp = await worker.fetch("/__scheduled");
			let text;
			if (resp) text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"Ran scheduled event"`);
			await worker.stop();
		});

		it("should not trigger scheduled event on wrong route", async () => {
			const worker = await unstable_dev(
				"index.js",
				{ testScheduled: true },
				{ disableExperimentalWarning: true }
			);

			const resp = await worker.fetch("/test");
			let text;
			if (resp) text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"Hello world!"`);
			await worker.stop();
		});
	});

	describe("service workers", () => {
		runInTempDir();

		beforeEach(() => {
			const scriptContent = `
			addEventListener("scheduled", (event) => {
				console.log("Doing something scheduled in service worker...");
			});

			addEventListener("fetch", (event) => {
				const url = new URL(event.request.url);
				if (url.pathname === "/__scheduled") {
					event.respondWith(new Response("Fetch triggered at /__scheduled"));
				} else {
					event.respondWith(new Response("Hello world!"));
				}
			});
			`;
			fs.writeFileSync("index.js", scriptContent);
		});

		it("should not intercept when middleware is not enabled", async () => {
			const worker = await unstable_dev(
				"index.js",
				{},
				{ disableExperimentalWarning: true }
			);

			const resp = await worker.fetch("/__scheduled");
			let text;
			if (resp) text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"Fetch triggered at /__scheduled"`);
			await worker.stop();
		});

		it("should intercept when middleware is enabled", async () => {
			const worker = await unstable_dev(
				"index.js",
				{ testScheduled: true },
				{ disableExperimentalWarning: true }
			);

			const resp = await worker.fetch("/__scheduled");
			let text;
			if (resp) text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"Ran scheduled event"`);
			await worker.stop();
		});

		it("should not trigger scheduled event on wrong route", async () => {
			const worker = await unstable_dev(
				"index.js",
				{ testScheduled: true },
				{ disableExperimentalWarning: true }
			);

			const resp = await worker.fetch("/test");
			let text;
			if (resp) text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"Hello world!"`);
			await worker.stop();
		});
	});
});
