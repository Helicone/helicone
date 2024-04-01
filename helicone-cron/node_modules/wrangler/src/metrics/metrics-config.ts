import { randomUUID } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fetchResult } from "../cfetch";
import { getConfigCache, saveToConfigCache } from "../config-cache";
import { confirm } from "../dialogs";
import { getEnvironmentVariableFactory } from "../environment-variables";
import { getGlobalWranglerConfigPath } from "../global-wrangler-config-path";
import { CI } from "../is-ci";
import isInteractive from "../is-interactive";
import { logger } from "../logger";
import { getAPIToken } from "../user";

/**
 * The date that the metrics being gathered was last updated in a way that would require
 * the user to give their permission again.
 *
 * When reading from a config file, we check the recorded date in the config file against
 * this one here. We ignore the permissions set in the the file if the recorded date is older.
 * This allows us to prompt the user to re-opt-in when we make substantive changes to our metrics
 * gathering.
 */
export const CURRENT_METRICS_DATE = new Date(2022, 6, 4);
export const USER_ID_CACHE_PATH = "user-id.json";

export const getWranglerSendMetricsFromEnv = getEnvironmentVariableFactory({
	variableName: "WRANGLER_SEND_METRICS",
});

export interface MetricsConfigOptions {
	/**
	 * Defines whether to send metrics to Cloudflare:
	 * If defined, then use this value for whether the dispatch is enabled.
	 * Otherwise, infer the enabled value from the user configuration.
	 */
	sendMetrics?: boolean;
	/**
	 * When true, do not make any CF API requests.
	 */
	offline?: boolean;
}

/**
 * The information needed to set up the MetricsDispatcher.
 */
export interface MetricsConfig {
	/** True if usage tracking is enabled. */
	enabled: boolean;
	/** A UID that identifies this user and machine pair for Wrangler. */
	deviceId: string;
	/** The currently logged in user - undefined if not logged in. */
	userId: string | undefined;
}

/**
 * Get hold of the permissions and device-id for metrics dispatch.
 *
 * The device-id is just a unique identifier sent along with events to help
 * to collate metrics. Once generated, this id is cached in the metrics config file.
 *
 * The permissions define whether we can send metrics or not. They can come from a variety of places:
 * - the `send_metrics` setting in `wrangler.toml`
 * - a cached response from the current user
 * - prompting the user to opt-in to metrics
 *
 * If the user was prompted to opt-in, then their response is cached in the metrics config file.
 *
 * If the current process is not interactive then we will cannot prompt the user and just assume
 * we cannot send metrics if there is no cached or project-level preference available.
 */
export async function getMetricsConfig({
	sendMetrics,
	offline = false,
}: MetricsConfigOptions): Promise<MetricsConfig> {
	const config = readMetricsConfig();
	const deviceId = getDeviceId(config);
	const userId = await getUserId(offline);

	// If the WRANGLER_SEND_METRICS environment variable has been set use that
	// and ignore everything else.
	const sendMetricsEnv = getWranglerSendMetricsFromEnv();
	if (sendMetricsEnv !== undefined) {
		return {
			enabled: sendMetricsEnv.toLowerCase() === "true",
			deviceId,
			userId,
		};
	}

	// If the project is explicitly set the `send_metrics` options in `wrangler.toml`
	// then use that and ignore any user preference.
	if (sendMetrics !== undefined) {
		return { enabled: sendMetrics, deviceId, userId };
	}

	// Get the user preference from the metrics config.
	const permission = config.permission;
	if (permission !== undefined) {
		if (new Date(permission.date) >= CURRENT_METRICS_DATE) {
			return { enabled: permission.enabled, deviceId, userId };
		} else if (permission.enabled) {
			logger.log(
				"Usage metrics tracking has changed since you last granted permission."
			);
		}
	}

	// We couldn't get the metrics permission from the project-level nor the user-level config.
	// If we are not interactive or in a CI build then just bail out.
	if (!isInteractive() || CI.isCI()) {
		return { enabled: false, deviceId, userId };
	}

	// Otherwise, let's ask the user and store the result in the metrics config.
	const enabled = await confirm(
		"Would you like to help improve Wrangler by sending usage metrics to Cloudflare?"
	);
	logger.log(
		`Your choice has been saved in the following file: ${path.relative(
			process.cwd(),
			getMetricsConfigPath()
		)}.\n\n` +
			"  You can override the user level setting for a project in `wrangler.toml`:\n\n" +
			"   - to disable sending metrics for a project: `send_metrics = false`\n" +
			"   - to enable sending metrics for a project: `send_metrics = true`"
	);
	writeMetricsConfig({
		permission: {
			enabled,
			date: CURRENT_METRICS_DATE,
		},
		deviceId,
	});
	return { enabled, deviceId, userId };
}

/**
 * Stringify and write the given info to the metrics config file.
 */
export function writeMetricsConfig(config: MetricsConfigFile) {
	mkdirSync(path.dirname(getMetricsConfigPath()), { recursive: true });
	writeFileSync(
		getMetricsConfigPath(),
		JSON.stringify(
			config,
			(_key, value) => (value instanceof Date ? value.toISOString() : value),
			"\t"
		)
	);
}

/**
 * Read and parse the metrics config file.
 */
export function readMetricsConfig(): MetricsConfigFile {
	try {
		const config = readFileSync(getMetricsConfigPath(), "utf8");
		return JSON.parse(config, (key, value) =>
			key === "date" ? new Date(value) : value
		);
	} catch {
		return {};
	}
}

/**
 * Get the path to the metrics config file.
 */
function getMetricsConfigPath(): string {
	return path.resolve(getGlobalWranglerConfigPath(), "metrics.json");
}

/**
 * The format of the metrics config file.
 */
export interface MetricsConfigFile {
	permission?: {
		/** True if Wrangler should send metrics to Cloudflare. */
		enabled: boolean;
		/** The date that this permission was set. */
		date: Date;
	};
	/** A unique UUID that identifies this device for metrics purposes. */
	deviceId?: string;
}

/**
 * Returns an ID that uniquely identifies Wrangler on this device to help collate events.
 *
 * Once created this ID is stored in the metrics config file.
 */
function getDeviceId(config: MetricsConfigFile) {
	// Get or create the deviceId.
	const deviceId = config.deviceId ?? randomUUID();
	if (config.deviceId === undefined) {
		// We had to create a new deviceID so store it now.
		writeMetricsConfig({ ...config, deviceId });
	}
	return deviceId;
}

/**
 * Returns the ID of the current user, which will be sent with each event.
 *
 * The ID is retrieved from the CF API `/user` endpoint if the user is authenticated and then
 * stored in the `node_modules/.cache`.
 *
 * If it is not possible to retrieve the ID (perhaps the user is not logged in) then we just use
 * `undefined`.
 */
async function getUserId(offline: boolean) {
	// Get the userId from the cache.
	// If it has not been found in the cache and we are not offline then make an API call to get it.
	// If we can't work in out then just use `anonymous`.
	let userId = getConfigCache<{ userId: string }>(USER_ID_CACHE_PATH).userId;
	if (userId === undefined && !offline) {
		userId = await fetchUserId();
		if (userId !== undefined) {
			saveToConfigCache(USER_ID_CACHE_PATH, { userId });
		}
	}
	return userId;
}

/**
 * Ask the Cloudflare API for the User ID of the current user.
 *
 * We will only do this if we are not "offline", e.g. not running `wrangler dev --local`.
 * Quietly return undefined if anything goes wrong.
 */
async function fetchUserId(): Promise<string | undefined> {
	try {
		return getAPIToken()
			? (await fetchResult<{ id: string }>("/user")).id
			: undefined;
	} catch (e) {
		return undefined;
	}
}
