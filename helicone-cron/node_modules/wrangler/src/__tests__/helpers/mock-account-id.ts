import { reinitialiseAuthTokens } from "../../user";

const ORIGINAL_CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ORIGINAL_CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

/**
 * Mock the API token so that we don't need to read it from user configuration files.
 *
 * Note that you can remove any API token from the environment by setting the value to `null`.
 * This is useful if a higher `describe()` block has already called `mockApiToken()`.
 */
export function mockApiToken({
	apiToken = "some-api-token",
}: { apiToken?: string | null } = {}) {
	beforeEach(() => {
		if (apiToken === null) {
			delete process.env.CLOUDFLARE_API_TOKEN;
		} else {
			process.env.CLOUDFLARE_API_TOKEN = apiToken;
		}
		// Now we have updated the environment, we must reinitialize the user auth state.
		reinitialiseAuthTokens();
	});
	afterEach(() => {
		process.env.CLOUDFLARE_API_TOKEN = ORIGINAL_CLOUDFLARE_API_TOKEN;
	});
}

/**
 * Mock the current account ID so that we don't need to read it from configuration files.
 *
 * Note that you can remove any account ID from the environment by setting the value to `null`.
 * This is useful if a higher `describe()` block has already called `mockAccountId()`.
 */
export function mockAccountId({
	accountId = "some-account-id",
}: { accountId?: string | null } = {}) {
	beforeEach(() => {
		if (accountId === null) {
			delete process.env.CLOUDFLARE_ACCOUNT_ID;
		} else {
			process.env.CLOUDFLARE_ACCOUNT_ID = accountId;
		}
	});
	afterEach(() => {
		process.env.CLOUDFLARE_ACCOUNT_ID = ORIGINAL_CLOUDFLARE_ACCOUNT_ID;
	});
}
