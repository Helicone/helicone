import { rest } from "msw";
import { mockAccountId, mockApiToken } from "./helpers/mock-account-id";
import { mockConsoleMethods } from "./helpers/mock-console";
import { mockConfirm } from "./helpers/mock-dialogs";
import { msw } from "./helpers/msw";
import { runInTempDir } from "./helpers/run-in-tmp";
import { runWrangler } from "./helpers/run-wrangler";
import writeWranglerToml from "./helpers/write-wrangler-toml";
import type { KVNamespaceInfo } from "../kv/helpers";

describe("delete", () => {
	mockAccountId();
	mockApiToken();
	runInTempDir();

	const std = mockConsoleMethods();

	it("should delete an entire service by name", async () => {
		mockConfirm({
			text: `Are you sure you want to delete my-script? This action cannot be undone.`,
			result: true,
		});
		mockListKVNamespacesRequest();
		mockDeleteWorkerRequest({ name: "my-script" });
		await runWrangler("delete --name my-script");

		expect(std).toMatchInlineSnapshot(`
		Object {
		  "debug": "",
		  "err": "",
		  "out": "Successfully deleted my-script",
		  "warn": "",
		}
	`);
	});

	it("should delete a script by configuration", async () => {
		mockConfirm({
			text: `Are you sure you want to delete test-name? This action cannot be undone.`,
			result: true,
		});
		writeWranglerToml();
		mockListKVNamespacesRequest();
		mockDeleteWorkerRequest();
		await runWrangler("delete");

		expect(std).toMatchInlineSnapshot(`
		Object {
		  "debug": "",
		  "err": "",
		  "out": "Successfully deleted test-name",
		  "warn": "",
		}
	`);
	});

	it("shouldn't delete a service when doing a --dry-run", async () => {
		await runWrangler("delete --name xyz --dry-run");

		expect(std).toMatchInlineSnapshot(`
		Object {
		  "debug": "",
		  "err": "",
		  "out": "--dry-run: exiting now.",
		  "warn": "",
		}
	`);
	});

	it('shouldn\'t delete when the user says "no"', async () => {
		mockConfirm({
			text: `Are you sure you want to delete xyz? This action cannot be undone.`,
			result: false,
		});

		await runWrangler("delete --name xyz");

		expect(std).toMatchInlineSnapshot(`
		Object {
		  "debug": "",
		  "err": "",
		  "out": "",
		  "warn": "",
		}
	`);
	});

	it("should delete a site namespace associated with a worker", async () => {
		const kvNamespaces = [
			{
				title: "__my-script-workers_sites_assets",
				id: "id-for-my-script-site-ns",
			},
			// this one isn't associated with the worker
			{
				title: "__test-name-workers_sites_assets",
				id: "id-for-another-site-ns",
			},
		];

		mockConfirm({
			text: `Are you sure you want to delete my-script? This action cannot be undone.`,
			result: true,
		});
		mockListKVNamespacesRequest(...kvNamespaces);
		// it should only try to delete the site namespace associated with this worker
		msw.use(
			rest.delete(
				"*/accounts/:accountId/storage/kv/namespaces/id-for-my-script-site-ns",
				(req, res, ctx) => {
					expect(req.params.accountId).toEqual("some-account-id");
					return res.once(
						ctx.status(200),
						ctx.json({ success: true, errors: [], messages: [], result: null })
					);
				}
			)
		);

		mockDeleteWorkerRequest({ name: "my-script" });
		await runWrangler("delete --name my-script");
		expect(std).toMatchInlineSnapshot(`
		Object {
		  "debug": "",
		  "err": "",
		  "out": "🌀 Deleted asset namespace for Workers Site \\"__my-script-workers_sites_assets\\"
		Successfully deleted my-script",
		  "warn": "",
		}
	`);
	});

	it("should delete a site namespace associated with a worker, including it's preview namespace", async () => {
		// This is the same test as the previous one, but it includes a preview namespace
		const kvNamespaces = [
			{
				title: "__my-script-workers_sites_assets",
				id: "id-for-my-script-site-ns",
			},
			// this is the preview namespace
			{
				title: "__my-script-workers_sites_assets_preview",
				id: "id-for-my-script-site-preview-ns",
			},

			// this one isn't associated with the worker
			{
				title: "__test-name-workers_sites_assets",
				id: "id-for-another-site-ns",
			},
		];

		mockConfirm({
			text: `Are you sure you want to delete my-script? This action cannot be undone.`,
			result: true,
		});
		mockListKVNamespacesRequest(...kvNamespaces);
		// it should only try to delete the site namespace associated with this worker

		msw.use(
			rest.delete(
				"*/accounts/:accountId/storage/kv/namespaces/id-for-my-script-site-ns",
				(req, res, ctx) => {
					expect(req.params.accountId).toEqual("some-account-id");
					return res.once(
						ctx.status(200),
						ctx.json({
							success: true,
							errors: [],
							messages: [],
							result: {},
						})
					);
				}
			)
		);

		msw.use(
			rest.delete(
				"*/accounts/:accountId/storage/kv/namespaces/id-for-my-script-site-preview-ns",
				(req, res, ctx) => {
					expect(req.params.accountId).toEqual("some-account-id");
					return res.once(
						ctx.status(200),
						ctx.json({
							success: true,
							errors: [],
							messages: [],
							result: {},
						})
					);
				}
			)
		);

		mockDeleteWorkerRequest({ name: "my-script" });
		await runWrangler("delete --name my-script");
		expect(std).toMatchInlineSnapshot(`
		Object {
		  "debug": "",
		  "err": "",
		  "out": "🌀 Deleted asset namespace for Workers Site \\"__my-script-workers_sites_assets\\"
		🌀 Deleted asset namespace for Workers Site \\"__my-script-workers_sites_assets_preview\\"
		Successfully deleted my-script",
		  "warn": "",
		}
	`);
	});
});

/** Create a mock handler for the request to upload a worker script. */
function mockDeleteWorkerRequest(
	options: {
		name?: string;
		env?: string;
		legacyEnv?: boolean;
	} = {}
) {
	const { env, legacyEnv, name } = options;
	msw.use(
		rest.delete(
			"*/accounts/:accountId/workers/services/:scriptName",
			(req, res, ctx) => {
				expect(req.params.accountId).toEqual("some-account-id");
				expect(req.params.scriptName).toEqual(
					legacyEnv && env
						? `${name ?? "test-name"}-${env}`
						: `${name ?? "test-name"}`
				);

				expect(req.url.searchParams.get("force")).toEqual("true");

				return res.once(
					ctx.status(200),
					ctx.json({
						success: true,
						errors: [],
						messages: [],
						result: null,
					})
				);
			}
		)
	);
}

/** Create a mock handler for the request to get a list of all KV namespaces. */
function mockListKVNamespacesRequest(...namespaces: KVNamespaceInfo[]) {
	msw.use(
		rest.get("*/accounts/:accountId/storage/kv/namespaces", (req, res, ctx) => {
			expect(req.params.accountId).toEqual("some-account-id");
			return res.once(
				ctx.status(200),
				ctx.json({
					success: true,
					errors: [],
					messages: [],
					result: namespaces,
				})
			);
		})
	);
}
