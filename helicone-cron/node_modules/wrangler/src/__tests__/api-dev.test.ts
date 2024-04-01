import * as fs from "node:fs";
import { Request } from "undici";
import { unstable_dev } from "../api";
import { runInTempDir } from "./helpers/run-in-tmp";

jest.unmock("undici");

describe.skip("unstable_dev", () => {
	it("should return Hello World", async () => {
		const worker = await unstable_dev(
			"src/__tests__/helpers/worker-scripts/hello-world-worker.js",
			{},
			{ disableExperimentalWarning: true }
		);
		const resp = await worker.fetch();
		if (resp) {
			const text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"Hello World!"`);
		}
		await worker.stop();
	});

	it("should return the port that the server started on (1)", async () => {
		const worker = await unstable_dev(
			"src/__tests__/helpers/worker-scripts/hello-world-worker.js",
			{},
			{ disableExperimentalWarning: true }
		);
		expect(worker.port).toBeGreaterThan(0);
		await worker.stop();
	});

	it("should return the port that the server started on (2)", async () => {
		const worker = await unstable_dev(
			"src/__tests__/helpers/worker-scripts/hello-world-worker.js",
			{ port: 9191 },
			{ disableExperimentalWarning: true }
		);
		expect(worker.port).toBe(9191);
		await worker.stop();
	});
});

describe("unstable dev fetch input protocol", () => {
	it("should use http localProtocol", async () => {
		const worker = await unstable_dev(
			"src/__tests__/helpers/worker-scripts/hello-world-worker.js",
			{ localProtocol: "http" },
			{ disableExperimentalWarning: true }
		);
		const res = await worker.fetch();
		if (res) {
			const text = await res.text();
			expect(text).toMatchInlineSnapshot(`"Hello World!"`);
		}
		await worker.stop();
	});

	it("should use undefined localProtocol", async () => {
		const worker = await unstable_dev(
			"src/__tests__/helpers/worker-scripts/hello-world-worker.js",
			{ localProtocol: undefined },
			{ disableExperimentalWarning: true }
		);
		const res = await worker.fetch();
		if (res) {
			const text = await res.text();
			expect(text).toMatchInlineSnapshot(`"Hello World!"`);
		}
		await worker.stop();
	});
});

describe("unstable dev fetch input parsing", () => {
	runInTempDir();

	it("should pass in a request object unchanged", async () => {
		const scriptContent = `
	export default {
		fetch(request, env, ctx) {
			const url = new URL(request.url);
			if (url.pathname === "/test") {
				if (request.method === "POST") {
					return new Response("requestPOST");
				}
				return new Response("requestGET");
			}
			return new Response('Hello world');
		}
	};
	`;
		fs.writeFileSync("index.js", scriptContent);
		const port = 21213;
		const worker = await unstable_dev(
			"index.js",
			{ port },
			{ disableExperimentalWarning: true }
		);
		const req = new Request("http://0.0.0.0:21213/test", {
			method: "POST",
		});
		const resp = await worker.fetch(req);
		let text;
		if (resp) text = await resp.text();
		expect(text).toMatchInlineSnapshot(`"requestPOST"`);
		await worker.stop();
	});

	it("should strip back to pathname for URL objects", async () => {
		const scriptContent = `
	export default {
		fetch(request, env, ctx) {
			const url = new URL(request.url);
			if (url.pathname === "/test") {
				return new Response("request");
			}
			return new Response('Hello world');
		}
	};
	`;
		fs.writeFileSync("index.js", scriptContent);
		const worker = await unstable_dev(
			"index.js",
			{},
			{ disableExperimentalWarning: true }
		);
		const url = new URL("http://localhost:80/test");
		const resp = await worker.fetch(url);
		let text;
		if (resp) text = await resp.text();
		expect(text).toMatchInlineSnapshot(`"request"`);
		await worker.stop();
	});

	it("should allow full url passed in string, and stripped back to pathname", async () => {
		const scriptContent = `
	export default {
		fetch(request, env, ctx) {
			const url = new URL(request.url);
			if (url.pathname === "/test") {
				return new Response("request");
			}
			return new Response('Hello world');
		}
	};
	`;
		fs.writeFileSync("index.js", scriptContent);
		const worker = await unstable_dev(
			"index.js",
			{},
			{ disableExperimentalWarning: true }
		);
		const resp = await worker.fetch("http://example.com/test");
		let text;
		if (resp) text = await resp.text();
		expect(text).toMatchInlineSnapshot(`"request"`);
		await worker.stop();
	});

	it("should allow pathname to be passed in", async () => {
		const scriptContent = `
	export default {
		fetch(request, env, ctx) {
			const url = new URL(request.url);
			if (url.pathname === "/test") {
				return new Response("request");
			}
			return new Response('Hello world');
		}
	};
	`;
		fs.writeFileSync("index.js", scriptContent);
		const worker = await unstable_dev(
			"index.js",
			{},
			{ disableExperimentalWarning: true }
		);
		const resp = await worker.fetch("/test");
		let text;
		if (resp) text = await resp.text();
		expect(text).toMatchInlineSnapshot(`"request"`);
		await worker.stop();
	});

	it("should allow no input be passed in", async () => {
		const scriptContent = `
	export default {
		fetch(request, env, ctx) {
			const url = new URL(request.url);
			if (url.pathname === "/test") {
				return new Response("request");
			}
			return new Response('Hello world');
		}
	};
	`;
		fs.writeFileSync("index.js", scriptContent);
		const worker = await unstable_dev(
			"index.js",
			{},
			{ disableExperimentalWarning: true }
		);
		const resp = await worker.fetch("");
		let text;
		if (resp) text = await resp.text();
		expect(text).toMatchInlineSnapshot(`"Hello world"`);
		await worker.stop();
	});
});
