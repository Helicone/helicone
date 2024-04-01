import { mockConsoleMethods } from "./helpers/mock-console";
import { runInTempDir } from "./helpers/run-in-tmp";
import { runWrangler } from "./helpers/run-wrangler";

describe("wrangler route", () => {
	mockConsoleMethods();
	runInTempDir();

	it("shows a deprecation notice when `wrangler route` is run", async () => {
		await expect(runWrangler("route")).rejects
			.toThrowErrorMatchingInlineSnapshot(`
            "Deprecation:
            \`wrangler route\` has been deprecated.
            Please use wrangler.toml and/or \`wrangler publish --routes\` to modify routes"
          `);
	});

	it("shows a deprecation notice when `wrangler route delete` is run", async () => {
		await expect(runWrangler("route delete")).rejects
			.toThrowErrorMatchingInlineSnapshot(`
            "Deprecation:
            \`wrangler route delete\` has been deprecated.
            Remove the unwanted route(s) from wrangler.toml and run \`wrangler publish\` to remove your worker from those routes."
          `);
	});

	it("shows a deprecation notice when `wrangler route delete <id>` is run", async () => {
		await expect(runWrangler("route delete some-zone-id")).rejects
			.toThrowErrorMatchingInlineSnapshot(`
            "Deprecation:
            \`wrangler route delete\` has been deprecated.
            Remove the unwanted route(s) from wrangler.toml and run \`wrangler publish\` to remove your worker from those routes."
          `);
	});

	it("shows a deprecation notice when `wrangler route list` is run", async () => {
		await expect(runWrangler("route list")).rejects
			.toThrowErrorMatchingInlineSnapshot(`
            "Deprecation:
            \`wrangler route list\` has been deprecated.
            Refer to wrangler.toml for a list of routes the worker will be deployed to upon publishing.
            Refer to the Cloudflare Dashboard to see the routes this worker is currently running on."
          `);
	});
});
