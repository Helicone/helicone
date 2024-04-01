import fs from "node:fs";
import path from "node:path";
import { rest } from "msw";
import { getGlobalWranglerConfigPath } from "../global-wrangler-config-path";
import { USER_AUTH_CONFIG_FILE, writeAuthConfigFile } from "../user";
import { mockConsoleMethods } from "./helpers/mock-console";
import { msw } from "./helpers/msw";
import { runInTempDir } from "./helpers/run-in-tmp";
import { runWrangler } from "./helpers/run-wrangler";

describe("logout", () => {
	runInTempDir();
	const std = mockConsoleMethods();

	it("should exit with a message stating the user is not logged in", async () => {
		await runWrangler("logout");
		expect(std.out).toMatchInlineSnapshot(`"Not logged in, exiting..."`);
	});

	it("should logout user that has been properly logged in", async () => {
		writeAuthConfigFile({
			oauth_token: "some-oauth-tok",
			refresh_token: "some-refresh-tok",
		});
		// Make sure that logout removed the config file containing the auth tokens.
		const config = path.join(
			getGlobalWranglerConfigPath(),
			USER_AUTH_CONFIG_FILE
		);
		let counter = 0;
		msw.use(
			rest.post("*/oauth2/revoke", (_, response, context) => {
				// Make sure that we made the request to logout.
				counter += 1;
				response.once(context.status(200), context.text(""));
			})
		);

		expect(fs.existsSync(config)).toBeTruthy();

		await runWrangler("logout");

		expect(std.out).toMatchInlineSnapshot(`"Successfully logged out."`);
		expect(fs.existsSync(config)).toBeFalsy();
		expect(counter).toBe(1);
	});
});
