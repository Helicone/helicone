import { render } from "ink-testing-library";
import { rest } from "msw";
import React from "react";
import { writeAuthConfigFile } from "../user";
import { getUserInfo, WhoAmI } from "../whoami";
import { mockConsoleMethods } from "./helpers/mock-console";
import { useMockIsTTY } from "./helpers/mock-istty";
import {
	msw,
	mswSuccessOauthHandlers,
	mswSuccessUserHandlers,
} from "./helpers/msw";
import { runInTempDir } from "./helpers/run-in-tmp";
import type { UserInfo } from "../whoami";

describe("getUserInfo()", () => {
	const ENV_COPY = process.env;

	runInTempDir();
	const std = mockConsoleMethods();
	const { setIsTTY } = useMockIsTTY();

	beforeEach(() => {
		msw.use(...mswSuccessOauthHandlers, ...mswSuccessUserHandlers);
		setIsTTY(true);
	});

	afterEach(() => {
		process.env = ENV_COPY;
	});

	it("should return undefined if there is no config file", async () => {
		const userInfo = await getUserInfo();
		expect(userInfo).toBeUndefined();
	});

	it("should return undefined if there is an empty config file", async () => {
		writeAuthConfigFile({});
		const userInfo = await getUserInfo();
		expect(userInfo).toBeUndefined();
	});

	it("should return undefined for email if the user settings API request fails with 9109", async () => {
		process.env = {
			CLOUDFLARE_API_TOKEN: "123456789",
		};
		msw.use(
			rest.get("*/user", (_, res, ctx) => {
				return res.once(
					ctx.status(200),
					ctx.json({
						success: false,
						errors: [
							{
								code: 9109,
								message: "Uauthorized to access requested resource",
							},
						],
						messages: [],
						result: {},
					})
				);
			}),
			rest.get("*/accounts", (request, res, ctx) => {
				const headersObject = request.headers.all();
				delete headersObject["user-agent"];

				expect(headersObject).toMatchInlineSnapshot(`
			Object {
			  "accept": "*/*",
			  "accept-encoding": "gzip,deflate",
			  "authorization": "Bearer 123456789",
			  "connection": "close",
			  "host": "api.cloudflare.com",
			}
		`);
				return res.once(
					ctx.status(200),
					ctx.json({
						success: true,
						errors: [],
						messages: [],
						result: [],
					})
				);
			})
		);
		const userInfo = await getUserInfo();
		expect(userInfo?.email).toBeUndefined();
	});
	it("should say it's using an API token when one is set", async () => {
		process.env = {
			CLOUDFLARE_API_TOKEN: "123456789",
		};

		const userInfo = await getUserInfo();
		expect(userInfo).toEqual({
			authType: "API Token",
			apiToken: "123456789",
			email: "user@example.com",
			accounts: [
				{ name: "Account One", id: "account-1" },
				{ name: "Account Two", id: "account-2" },
				{ name: "Account Three", id: "account-3" },
			],
		});
	});

	it("should say it's using a Global API Key when one is set", async () => {
		process.env = {
			CLOUDFLARE_API_KEY: "123456789",
			CLOUDFLARE_EMAIL: "user@example.com",
		};

		const userInfo = await getUserInfo();
		expect(userInfo).toEqual({
			authType: "Global API Key",
			apiToken: "123456789",
			email: "user@example.com",
			accounts: [
				{ name: "Account One", id: "account-1" },
				{ name: "Account Two", id: "account-2" },
				{ name: "Account Three", id: "account-3" },
			],
		});
	});

	it("should use a Global API Key in preference to an API token", async () => {
		process.env = {
			CLOUDFLARE_API_KEY: "123456789",
			CLOUDFLARE_EMAIL: "user@example.com",
			CLOUDFLARE_API_TOKEN: "123456789",
		};

		const userInfo = await getUserInfo();
		expect(userInfo).toEqual({
			authType: "Global API Key",
			apiToken: "123456789",
			email: "user@example.com",
			accounts: [
				{ name: "Account One", id: "account-1" },
				{ name: "Account Two", id: "account-2" },
				{ name: "Account Three", id: "account-3" },
			],
		});
	});

	it("should return undefined only a Global API Key, but not Email, is set", async () => {
		process.env = {
			CLOUDFLARE_API_KEY: "123456789",
		};
		const userInfo = await getUserInfo();
		expect(userInfo).toEqual(undefined);
	});

	it("should return the user's email and accounts if authenticated via config token", async () => {
		writeAuthConfigFile({ oauth_token: "some-oauth-token" });
		const userInfo = await getUserInfo();

		expect(userInfo).toEqual({
			authType: "OAuth Token",
			apiToken: "some-oauth-token",
			email: "user@example.com",
			accounts: [
				{ name: "Account One", id: "account-1" },
				{ name: "Account Two", id: "account-2" },
				{ name: "Account Three", id: "account-3" },
			],
		});
	});

	it("should display a warning message if the config file contains a legacy api_token field", async () => {
		writeAuthConfigFile({ api_token: "API_TOKEN" });
		await getUserInfo();

		expect(std.warn).toMatchInlineSnapshot(`
		      "[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mIt looks like you have used Wrangler 1's \`config\` command to login with an API token.[0m

		        This is no longer supported in the current version of Wrangler.
		        If you wish to authenticate via an API token then please set the \`CLOUDFLARE_API_TOKEN\`
		        environment variable.

		      "
	    `);
	});
});

describe("WhoAmI component", () => {
	it("should return undefined if there is no user", async () => {
		const { lastFrame } = render(<WhoAmI user={undefined}></WhoAmI>);

		expect(lastFrame()).toMatchInlineSnapshot(
			`"You are not authenticated. Please run \`wrangler login\`."`
		);
	});

	it("should display the user's email, accounts and OAuth scopes", async () => {
		const user: UserInfo = {
			authType: "OAuth Token",
			apiToken: "some-oauth-token",
			email: "user@example.com",
			tokenPermissions: ["scope1:read", "scope2:write", "scope3"],
			accounts: [
				{ name: "Account One", id: "account-1" },
				{ name: "Account Two", id: "account-2" },
				{ name: "Account Three", id: "account-3" },
			],
		};

		const { lastFrame } = render(<WhoAmI user={user}></WhoAmI>);

		expect(lastFrame()).toContain(
			"You are logged in with an OAuth Token, associated with the email 'user@example.com'!"
		);
		expect(lastFrame()).toMatch(/Account Name .+ Account ID/);
		expect(lastFrame()).toMatch(/Account One .+ account-1/);
		expect(lastFrame()).toMatch(/Account Two .+ account-2/);
		expect(lastFrame()).toMatch(/Account Three .+ account-3/);
		expect(lastFrame()).toContain(
			"Token Permissions: If scopes are missing, you may need to logout and re-login."
		);
		expect(lastFrame()).toContain("- scope1 (read)");
		expect(lastFrame()).toContain("- scope2 (write)");
		expect(lastFrame()).toContain("- scope3");
	});

	// For the case where the cache hasn't updated to include the scopes array
	it("should display the user's email and accounts, but no OAuth scopes if none provided", async () => {
		const user: UserInfo = {
			authType: "OAuth Token",
			apiToken: "some-oauth-token",
			email: "user@example.com",
			tokenPermissions: undefined,
			accounts: [
				{ name: "Account One", id: "account-1" },
				{ name: "Account Two", id: "account-2" },
				{ name: "Account Three", id: "account-3" },
			],
		};

		const { lastFrame } = render(<WhoAmI user={user}></WhoAmI>);

		expect(lastFrame()).toContain(
			"You are logged in with an OAuth Token, associated with the email 'user@example.com'!"
		);
		expect(lastFrame()).toMatch(/Account Name .+ Account ID/);
		expect(lastFrame()).toMatch(/Account One .+ account-1/);
		expect(lastFrame()).toMatch(/Account Two .+ account-2/);
		expect(lastFrame()).toMatch(/Account Three .+ account-3/);
	});

	it("should display the user's email, accounts and link to view token permissions for non-OAuth tokens", async () => {
		const user: UserInfo = {
			authType: "API Token",
			apiToken: "some-api-token",
			email: "user@example.com",
			tokenPermissions: undefined,
			accounts: [
				{ name: "Account One", id: "account-1" },
				{ name: "Account Two", id: "account-2" },
				{ name: "Account Three", id: "account-3" },
			],
		};

		const { lastFrame } = render(<WhoAmI user={user}></WhoAmI>);

		expect(lastFrame()).toContain(
			"You are logged in with an API Token, associated with the email 'user@example.com'!"
		);
		expect(lastFrame()).toMatch(/Account Name .+ Account ID/);
		expect(lastFrame()).toMatch(/Account One .+ account-1/);
		expect(lastFrame()).toMatch(/Account Two .+ account-2/);
		expect(lastFrame()).toMatch(/Account Three .+ account-3/);
		expect(lastFrame()).toContain(
			"To see token permissions visit https://dash.cloudflare.com/profile/api-tokens"
		);
	});
});
