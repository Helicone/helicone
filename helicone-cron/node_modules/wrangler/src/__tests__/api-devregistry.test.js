import { unstable_dev } from "../api";
import { fetch } from "undici";

// jest.unmock("undici");

/**
 * a huge caveat to how testing multi-worker scripts works:
 * you can't shutdown the first worker you spun up, or it'll kill the devRegistry
 */
describe.skip("multi-worker testing", () => {
	let childWorker;
	let parentWorker;

	beforeAll(async () => {
		childWorker = await unstable_dev(
			"src/__tests__/helpers/worker-scripts/hello-world-worker.js",
			{ config: "src/__tests__/helpers/worker-scripts/child-wrangler.toml" },
			{ disableExperimentalWarning: true }
		);
		parentWorker = await unstable_dev(
			"src/__tests__/helpers/worker-scripts/parent-worker.js",
			{ config: "src/__tests__/helpers/worker-scripts/parent-wrangler.toml" },
			{ disableExperimentalWarning: true }
		);
	});

	afterAll(async () => {
		await childWorker.stop();
		await parentWorker.stop();
	});

	it("parentWorker and childWorker should be added devRegistry", async () => {
		const resp = await fetch("http://localhost:6284/workers");
		if (resp) {
			const parsedResp = await resp.json();
			expect(parsedResp.parent).toBeTruthy();
			expect(parsedResp.child).toBeTruthy();
		}
	});

	it("childWorker should return Hello World itself", async () => {
		const resp = await childWorker.fetch();
		if (resp) {
			const text = await resp.text();
			expect(text).toMatchInlineSnapshot(`"Hello World!"`);
		}
	});

	it("parentWorker should return Hello World by invoking the child worker", async () => {
		const resp = await parentWorker.fetch();
		if (resp) {
			const parsedResp = await resp.text();
			expect(parsedResp).toEqual("Parent worker sees: Hello World!");
		}
	});
});
