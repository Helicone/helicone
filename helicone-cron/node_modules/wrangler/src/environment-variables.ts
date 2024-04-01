import { logger } from "./logger";

type VariableNames =
	| "CLOUDFLARE_ACCOUNT_ID"
	| "CLOUDFLARE_API_TOKEN"
	| "CLOUDFLARE_API_KEY"
	| "CLOUDFLARE_EMAIL"
	| "WRANGLER_SEND_METRICS"
	| "CLOUDFLARE_API_BASE_URL"
	| "WRANGLER_LOG";

type DeprecatedNames =
	| "CF_ACCOUNT_ID"
	| "CF_API_TOKEN"
	| "CF_API_KEY"
	| "CF_EMAIL"
	| "CF_API_BASE_URL";
/**
 * Create a function used to access an environment variable.
 *
 * This is not memoized to allow us to change the value at runtime, such as in testing.
 * A warning is shown if the client is using a deprecated version - but only once.
 */
export function getEnvironmentVariableFactory({
	variableName,
	deprecatedName,
	defaultValue,
}: {
	variableName: VariableNames;
	deprecatedName?: DeprecatedNames;
	defaultValue?: string;
}) {
	let hasWarned = false;
	return () => {
		if (process.env[variableName]) {
			return process.env[variableName];
		} else if (deprecatedName && process.env[deprecatedName]) {
			if (!hasWarned) {
				// Only show the warning once.
				hasWarned = true;
				logger.warn(
					`Using "${deprecatedName}" environment variable. This is deprecated. Please use "${variableName}", instead.`
				);
			}
			return process.env[deprecatedName];
		} else {
			return defaultValue;
		}
	};
}
