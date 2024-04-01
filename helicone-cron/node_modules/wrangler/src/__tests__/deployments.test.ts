// import * as fs from "fs";
// import * as TOML from "@iarna/toml";
import { rest } from "msw";
import { mockAccountId, mockApiToken } from "./helpers/mock-account-id";
import { mockConsoleMethods } from "./helpers/mock-console";
import {
	msw,
	mswSuccessOauthHandlers,
	mswSuccessUserHandlers,
} from "./helpers/msw";
import { mswSuccessDeployments } from "./helpers/msw";
import { runInTempDir } from "./helpers/run-in-tmp";
import { runWrangler } from "./helpers/run-wrangler";

describe("deployments", () => {
	const std = mockConsoleMethods();
	runInTempDir();
	mockAccountId();
	mockApiToken();
	runInTempDir();

	beforeEach(() => {
		msw.use(
			...mswSuccessDeployments,
			...mswSuccessOauthHandlers,
			...mswSuccessUserHandlers,
			rest.get(
				"*/accounts/:accountId/workers/services/:scriptName",
				(request, response, context) => {
					expect(["undefined", "somethingElse"]).toContain(
						request.params.scriptName
					);

					return response.once(
						context.status(200),
						context.json({
							success: true,
							errors: [],
							messages: [],
							result: {
								default_environment: {
									script: {
										tag: "MOCK-TAG",
									},
								},
							},
						})
					);
				}
			)
		);
	});

	it("should log deployments", async () => {
		await runWrangler("deployments");
		expect(std.out).toMatchInlineSnapshot(`
		"🚧\`wrangler deployments\` is a beta command. Please report any issues to https://github.com/cloudflare/wrangler2/issues/new/choose


		Deployment ID: Galaxy-Class
		Created on: 2021-01-01T00:00:00.000000Z
		Author: Jean-Luc-Picard@federation.org
		Source: Wrangler

		Deployment ID: Intrepid-Class
		Created on: 2021-02-02T00:00:00.000000Z
		Author: Kathryn-Janeway@federation.org
		Source: Wrangler
		🟩 Active"
	`);
	});

	it("should log deployments for script with passed in name option", async () => {
		await runWrangler("deployments --name somethingElse");
		expect(std.out).toMatchInlineSnapshot(`
		"🚧\`wrangler deployments\` is a beta command. Please report any issues to https://github.com/cloudflare/wrangler2/issues/new/choose


		Deployment ID: Galaxy-Class
		Created on: 2021-01-01T00:00:00.000000Z
		Author: Jean-Luc-Picard@federation.org
		Source: Wrangler

		Deployment ID: Intrepid-Class
		Created on: 2021-02-02T00:00:00.000000Z
		Author: Kathryn-Janeway@federation.org
		Source: Wrangler
		🟩 Active"
	`);
	});
});
