import { getEnvironmentVariableFactory } from "../environment-variables";

export type ApiCredentials =
	| {
			apiToken: string;
	  }
	| {
			authKey: string;
			authEmail: string;
	  };

const getCloudflareAPITokenFromEnv = getEnvironmentVariableFactory({
	variableName: "CLOUDFLARE_API_TOKEN",
	deprecatedName: "CF_API_TOKEN",
});
const getCloudflareGlobalAuthKeyFromEnv = getEnvironmentVariableFactory({
	variableName: "CLOUDFLARE_API_KEY",
	deprecatedName: "CF_API_KEY",
});
const getCloudflareGlobalAuthEmailFromEnv = getEnvironmentVariableFactory({
	variableName: "CLOUDFLARE_EMAIL",
	deprecatedName: "CF_EMAIL",
});

/**
 * Try to read an API token or Global Auth from the environment.
 */
export function getAuthFromEnv(): ApiCredentials | undefined {
	const globalApiKey = getCloudflareGlobalAuthKeyFromEnv();
	const globalApiEmail = getCloudflareGlobalAuthEmailFromEnv();
	const apiToken = getCloudflareAPITokenFromEnv();

	if (globalApiKey && globalApiEmail) {
		return { authKey: globalApiKey, authEmail: globalApiEmail };
	} else if (apiToken) {
		return { apiToken };
	}
}

/**
 * Try to read the account ID from the environment.
 */
export const getCloudflareAccountIdFromEnv = getEnvironmentVariableFactory({
	variableName: "CLOUDFLARE_ACCOUNT_ID",
	deprecatedName: "CF_ACCOUNT_ID",
});
