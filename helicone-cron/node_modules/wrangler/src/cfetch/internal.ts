import assert from "node:assert";
import { fetch, File, Headers } from "undici";
import { version as wranglerVersion } from "../../package.json";
import { getEnvironmentVariableFactory } from "../environment-variables";
import { logger } from "../logger";
import { ParseError, parseJSON } from "../parse";
import { loginOrRefreshIfRequired, requireApiToken } from "../user";
import type { ApiCredentials } from "../user";
import type { URLSearchParams } from "node:url";
import type { RequestInit, HeadersInit, Response } from "undici";

/**
 * Get the URL to use to access the Cloudflare API.
 */
export const getCloudflareAPIBaseURL = getEnvironmentVariableFactory({
	variableName: "CLOUDFLARE_API_BASE_URL",
	deprecatedName: "CF_API_BASE_URL",
	defaultValue: "https://api.cloudflare.com/client/v4",
});

/*
 * performApiFetch does everything required to make a CF API request,
 * but doesn't parse the response as JSON. For normal V4 API responses,
 * use `fetchInternal`
 * */
export async function performApiFetch(
	resource: string,
	init: RequestInit = {},
	queryParams?: URLSearchParams,
	abortSignal?: AbortSignal
) {
	const method = init.method ?? "GET";
	assert(
		resource.startsWith("/"),
		`CF API fetch - resource path must start with a "/" but got "${resource}"`
	);
	await requireLoggedIn();
	const apiToken = requireApiToken();
	const headers = cloneHeaders(init.headers);
	addAuthorizationHeaderIfUnspecified(headers, apiToken);
	addUserAgent(headers);

	const queryString = queryParams ? `?${queryParams.toString()}` : "";
	logger.debug(
		`-- START CF API REQUEST: ${method} ${getCloudflareAPIBaseURL()}${resource}${queryString}`
	);
	logger.debug("HEADERS:", JSON.stringify(headers, null, 2));
	logger.debug("INIT:", JSON.stringify(init, null, 2));
	logger.debug("-- END CF API REQUEST");
	return await fetch(`${getCloudflareAPIBaseURL()}${resource}${queryString}`, {
		method,
		...init,
		headers,
		signal: abortSignal,
	});
}

/**
 * Make a fetch request to the Cloudflare API.
 *
 * This function handles acquiring the API token and logging the caller in, as necessary.
 *
 * Check out https://api.cloudflare.com/ for API docs.
 *
 * This function should not be used directly, instead use the functions in `cfetch/index.ts`.
 */
export async function fetchInternal<ResponseType>(
	resource: string,
	init: RequestInit = {},
	queryParams?: URLSearchParams,
	abortSignal?: AbortSignal
): Promise<ResponseType> {
	const method = init.method ?? "GET";
	const response = await performApiFetch(
		resource,
		init,
		queryParams,
		abortSignal
	);
	const jsonText = await response.text();
	logger.debug(
		"-- START CF API RESPONSE:",
		response.statusText,
		response.status
	);
	logger.debug("HEADERS:", JSON.stringify(response.headers, null, 2));
	logger.debug("RESPONSE:", jsonText);
	logger.debug("-- END CF API RESPONSE");

	try {
		return parseJSON<ResponseType>(jsonText);
	} catch (err) {
		throw new ParseError({
			text: "Received a malformed response from the API",
			notes: [
				{
					text: truncate(jsonText, 100),
				},
				{
					text: `${method} ${resource} -> ${response.status} ${response.statusText}`,
				},
			],
		});
	}
}

function truncate(text: string, maxLength: number): string {
	const { length } = text;
	if (length <= maxLength) {
		return text;
	}
	return `${text.substring(0, maxLength)}... (length = ${length})`;
}

function cloneHeaders(
	headers: HeadersInit | undefined
): Record<string, string> {
	return headers instanceof Headers
		? Object.fromEntries(headers.entries())
		: Array.isArray(headers)
		? Object.fromEntries(headers)
		: { ...headers };
}

async function requireLoggedIn(): Promise<void> {
	const loggedIn = await loginOrRefreshIfRequired();
	if (!loggedIn) {
		throw new Error("Not logged in.");
	}
}

function addAuthorizationHeaderIfUnspecified(
	headers: Record<string, string>,
	auth: ApiCredentials
): void {
	if (!("Authorization" in headers)) {
		if ("apiToken" in auth) {
			headers["Authorization"] = `Bearer ${auth.apiToken}`;
		} else {
			headers["X-Auth-Key"] = auth.authKey;
			headers["X-Auth-Email"] = auth.authEmail;
		}
	}
}

function addUserAgent(headers: Record<string, string>): void {
	headers["User-Agent"] = `wrangler/${wranglerVersion}`;
}

/**
 * The implementation for fetching a kv value from the cloudflare API.
 * We special-case this one call, because it's the only API call that
 * doesn't return json. We inline the implementation and try not to share
 * any code with the other calls. We should push back on any new APIs that
 * try to introduce non-"standard" response structures.
 *
 * Note: any calls to fetchKVGetValue must call encodeURIComponent on key
 * before passing it
 */
export async function fetchKVGetValue(
	accountId: string,
	namespaceId: string,
	key: string
): Promise<ArrayBuffer> {
	await requireLoggedIn();
	const auth = requireApiToken();
	const headers: Record<string, string> = {};
	addAuthorizationHeaderIfUnspecified(headers, auth);
	const resource = `${getCloudflareAPIBaseURL()}/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${key}`;
	const response = await fetch(resource, {
		method: "GET",
		headers,
	});
	if (response.ok) {
		return await response.arrayBuffer();
	} else {
		throw new Error(
			`Failed to fetch ${resource} - ${response.status}: ${response.statusText});`
		);
	}
}

/**
 * The implementation for fetching a R2 object from Cloudflare API.
 * We have a special implementation to handle the non-standard API response
 * that doesn't return JSON, likely due to the streaming nature.
 *
 * note: The implementation should be called from light wrappers for
 * different methods (GET, PUT)
 */
type ResponseWithBody = Response & { body: NonNullable<Response["body"]> };
export async function fetchR2Objects(
	resource: string,
	bodyInit: RequestInit = {}
): Promise<ResponseWithBody> {
	await requireLoggedIn();
	const auth = requireApiToken();
	const headers = cloneHeaders(bodyInit.headers);
	addAuthorizationHeaderIfUnspecified(headers, auth);
	addUserAgent(headers);

	const response = await fetch(`${getCloudflareAPIBaseURL()}${resource}`, {
		...bodyInit,
		headers,
	});

	if (response.ok && response.body) {
		return response as ResponseWithBody;
	} else {
		throw new Error(
			`Failed to fetch ${resource} - ${response.status}: ${response.statusText});`
		);
	}
}

/**
 * This is a wrapper STOPGAP for getting the script which returns a raw text response.
 */
export async function fetchDashboardScript(
	resource: string,
	bodyInit: RequestInit = {}
): Promise<string> {
	await requireLoggedIn();
	const auth = requireApiToken();
	const headers = cloneHeaders(bodyInit.headers);
	addAuthorizationHeaderIfUnspecified(headers, auth);
	addUserAgent(headers);

	const response = await fetch(`${getCloudflareAPIBaseURL()}${resource}`, {
		...bodyInit,
		headers,
	});

	if (!response.ok || !response.body) {
		throw new Error(
			`Failed to fetch ${resource} - ${response.status}: ${response.statusText});`
		);
	}

	const usesModules = response.headers
		.get("content-type")
		?.startsWith("multipart");

	if (usesModules) {
		// Response from edge contains generic "name = worker.js" for dashboard created scripts
		const form = await response.formData();
		const entries = Array.from(form.entries());
		if (entries.length > 1)
			throw new RangeError("Expected only one entry in multipart response");
		const [_, file] = entries[0];

		if (file instanceof File) {
			return await file.text();
		}

		return file ?? "";

		// Follow up on issue in Undici about multipart/form-data support & replace the workaround: https://github.com/nodejs/undici/issues/974
		// This should be using a builtin formData() parser pattern.
	} else {
		return response.text();
	}
}
