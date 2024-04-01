import { rest } from "msw";
import { CI } from "../is-ci";
import {
	loginOrRefreshIfRequired,
	readAuthConfigFile,
	requireAuth,
	writeAuthConfigFile,
} from "../user";
import { mockConsoleMethods } from "./helpers/mock-console";
import { useMockIsTTY } from "./helpers/mock-istty";
import { mockOAuthFlow } from "./helpers/mock-oauth-flow";
import {
	msw,
	mswSuccessOauthHandlers,
	mswSuccessUserHandlers,
} from "./helpers/msw";
import { runInTempDir } from "./helpers/run-in-tmp";
import { runWrangler } from "./helpers/run-wrangler";
import type { Config } from "../config";
import type { UserAuthConfig } from "../user";

describe("User", () => {
	let isCISpy: jest.SpyInstance;
	runInTempDir();
	const std = mockConsoleMethods();
	// TODO: Implement these two mocks with MSW
	const { mockOAuthServerCallback } = mockOAuthFlow();
	const { setIsTTY } = useMockIsTTY();

	beforeEach(() => {
		msw.use(...mswSuccessOauthHandlers, ...mswSuccessUserHandlers);
		isCISpy = jest.spyOn(CI, "isCI").mockReturnValue(false);
	});

	describe("login", () => {
		it("should login a user when `wrangler login` is run", async () => {
			mockOAuthServerCallback("success");

			let counter = 0;
			msw.use(
				rest.post("*/oauth2/token", async (_, response, context) => {
					counter += 1;

					return response.once(
						context.status(200),
						context.json({
							access_token: "test-access-token",
							expires_in: 100000,
							refresh_token: "test-refresh-token",
							scope: "account:read",
						})
					);
				})
			);

			await runWrangler("login");

			expect(counter).toBe(1);
			expect(std.out).toMatchInlineSnapshot(`
			"Attempting to login via OAuth...
			Opening a link in your default browser: https://dash.cloudflare.com/oauth2/auth?response_type=code&client_id=54d11594-84e4-41aa-b438-e81b8fa78ee7&redirect_uri=http%3A%2F%2Flocalhost%3A8976%2Foauth%2Fcallback&scope=account%3Aread%20user%3Aread%20workers%3Awrite%20workers_kv%3Awrite%20workers_routes%3Awrite%20workers_scripts%3Awrite%20workers_tail%3Aread%20d1%3Awrite%20pages%3Awrite%20zone%3Aread%20offline_access&state=MOCK_STATE_PARAM&code_challenge=MOCK_CODE_CHALLENGE&code_challenge_method=S256
			Successfully logged in."
		`);
			expect(readAuthConfigFile()).toEqual<UserAuthConfig>({
				api_token: undefined,
				oauth_token: "test-access-token",
				refresh_token: "test-refresh-token",
				expiration_time: expect.any(String),
				scopes: ["account:read"],
			});
		});
	});

	it("should handle errors for failed token refresh in a non-interactive environment", async () => {
		setIsTTY(false);
		writeAuthConfigFile({
			oauth_token: "hunter2",
			refresh_token: "Order 66",
		});
		// TODO: Use MSW to handle `/token` endpoints from different calls
		let counter = 0;
		msw.use(
			rest.post("*/oauth2/token", async (request, response, context) => {
				counter += 1;
				return response.once(
					context.status(400),
					context.body(
						`<html> <body> This shouldn't be sent, but should be handled </body> </html>`
					)
				);
			})
		);

		// Handles the requireAuth error throw from failed login that is unhandled due to directly calling it here
		await expect(
			requireAuth({} as Config)
		).rejects.toThrowErrorMatchingInlineSnapshot(
			`"In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN environment variable for wrangler to work. Please go to https://developers.cloudflare.com/api/tokens/create/ for instructions on how to create an api token, and assign its value to CLOUDFLARE_API_TOKEN."`
		);
		expect(counter).toBe(0);
	});

	it("should confirm no error message when refresh is successful", async () => {
		setIsTTY(false);
		writeAuthConfigFile({
			oauth_token: "hunter2",
			refresh_token: "Order 66",
		});

		// Handles the requireAuth error throw from failed login that is unhandled due to directly calling it here
		await expect(requireAuth({} as Config)).rejects.toThrowError();
		expect(std.err).toContain("");
	});

	it("should revert to non-interactive mode if in CI", async () => {
		isCISpy.mockReturnValue(true);
		await expect(loginOrRefreshIfRequired()).resolves.toEqual(false);
	});

	it("should revert to non-interactive mode if isTTY throws an error", async () => {
		setIsTTY({
			stdin() {
				throw new Error("stdin is not tty");
			},
			stdout: true,
		});
		await expect(loginOrRefreshIfRequired()).resolves.toEqual(false);
	});
});
