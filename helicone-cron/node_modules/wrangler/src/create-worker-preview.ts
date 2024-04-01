import { URL } from "node:url";
import { fetch } from "undici";
import { fetchResult } from "./cfetch";
import { createWorkerUploadForm } from "./create-worker-upload-form";
import { logger } from "./logger";
import { parseJSON } from "./parse";
import { getAccessToken } from "./user/access";
import type { CfAccount, CfWorkerContext, CfWorkerInit } from "./worker";
import type { HeadersInit } from "undici";

/**
 * A Preview Session on the edge
 */
export interface CfPreviewSession {
	/**
	 * A randomly generated id for this session
	 */
	id: string;
	/**
	 * A value to use when creating a worker preview under a session
	 */
	value: string;
	/**
	 * The host where the session is available.
	 */
	host: string;
	/**
	 * A websocket url to a DevTools inspector.
	 *
	 * Workers does not have a fully-featured implementation
	 * of the Chrome DevTools protocol, but supports the following:
	 *  * `console.log()` output.
	 *  * `Error` stack traces.
	 *  * `fetch()` events.
	 *
	 * There is no support for breakpoints, but we want to implement
	 * this eventually.
	 *
	 * @link https://chromedevtools.github.io/devtools-protocol/
	 */
	inspectorUrl: URL;
	/**
	 * A url to prewarm the preview session.
	 *
	 * @example
	 * fetch(prewarmUrl, { method: 'POST' })
	 */
	prewarmUrl: URL;
}

/**
 * A preview mode.
 *
 * * If true, then using a `workers.dev` subdomain.
 * * Otherwise, a list of routes under a single zone.
 */
type CfPreviewMode = { workers_dev: boolean } | { routes: string[] };

/**
 * A preview token.
 */
export interface CfPreviewToken {
	/**
	 * The header value required to trigger a preview.
	 *
	 * @example
	 * const headers = { 'cf-workers-preview-token': value }
	 * const response = await fetch('https://' + host, { headers })
	 */
	value: string;
	/**
	 * The host where the preview is available.
	 */
	host: string;
	/**
	 * A websocket url to a DevTools inspector.
	 *
	 * Workers does not have a fully-featured implementation
	 * of the Chrome DevTools protocol, but supports the following:
	 *  * `console.log()` output.
	 *  * `Error` stack traces.
	 *  * `fetch()` events.
	 *
	 * There is no support for breakpoints, but we want to implement
	 * this eventually.
	 *
	 * @link https://chromedevtools.github.io/devtools-protocol/
	 */
	inspectorUrl: URL;
	/**
	 * A url to prewarm the preview session.
	 *
	 * @example
	 * fetch(prewarmUrl, { method: 'POST',
	 * 	 headers: {
	 *     "cf-workers-preview-token": (preview)token.value,
	 *   }
	 * })
	 */
	prewarmUrl: URL;
}

// Credit: https://stackoverflow.com/a/2117523
function randomId(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0,
			v = c == "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * Generates a preview session token.
 */
export async function createPreviewSession(
	account: CfAccount,
	ctx: CfWorkerContext,
	abortSignal: AbortSignal
): Promise<CfPreviewSession> {
	const { accountId } = account;
	const initUrl = ctx.zone
		? `/zones/${ctx.zone}/workers/edge-preview`
		: `/accounts/${accountId}/workers/subdomain/edge-preview`;

	const { exchange_url } = await fetchResult<{ exchange_url: string }>(
		initUrl,
		undefined,
		undefined,
		abortSignal
	);

	logger.debug(`-- START EXCHANGE API REQUEST: GET ${exchange_url}`);
	logger.debug("-- END EXCHANGE API REQUEST");
	const exchangeResponse = await fetch(exchange_url, { signal: abortSignal });
	const bodyText = await exchangeResponse.text();
	logger.debug(
		"-- START EXCHANGE API RESPONSE:",
		exchangeResponse.statusText,
		exchangeResponse.status
	);
	logger.debug("HEADERS:", JSON.stringify(exchangeResponse.headers, null, 2));
	logger.debug("RESPONSE:", bodyText);
	logger.debug("-- END EXCHANGE API RESPONSE");

	const { inspector_websocket, prewarm, token } = parseJSON<{
		inspector_websocket: string;
		token: string;
		prewarm: string;
	}>(bodyText);

	const { host } = new URL(inspector_websocket);
	const query = `cf_workers_preview_token=${token}`;

	return {
		id: randomId(),
		value: token,
		host,
		inspectorUrl: new URL(`${inspector_websocket}?${query}`),
		prewarmUrl: new URL(prewarm),
	};
}

/**
 * Creates a preview token.
 */
async function createPreviewToken(
	account: CfAccount,
	worker: CfWorkerInit,
	ctx: CfWorkerContext,
	session: CfPreviewSession,
	abortSignal: AbortSignal
): Promise<CfPreviewToken> {
	const { value, host, inspectorUrl, prewarmUrl } = session;
	const { accountId } = account;
	const scriptId = worker.name || (ctx.zone ? session.id : host.split(".")[0]);
	const url =
		ctx.env && !ctx.legacyEnv
			? `/accounts/${accountId}/workers/services/${scriptId}/environments/${ctx.env}/edge-preview`
			: `/accounts/${accountId}/workers/scripts/${scriptId}/edge-preview`;

	const mode: CfPreviewMode = ctx.zone
		? {
				routes: ctx.routes
					? // extract all the route patterns
					  ctx.routes.map((route) => {
							if (typeof route === "string") {
								return route;
							}
							if (route.custom_domain) {
								return `${route.pattern}/*`;
							}
							return route.pattern;
					  })
					: // if there aren't any patterns, then just match on all routes
					  ["*/*"],
		  }
		: { workers_dev: true };

	const formData = createWorkerUploadForm(worker);
	formData.set("wrangler-session-config", JSON.stringify(mode));

	const { preview_token } = await fetchResult<{ preview_token: string }>(
		url,
		{
			method: "POST",
			body: formData,
			headers: {
				"cf-preview-upload-config-token": value,
			},
		},
		undefined,
		abortSignal
	);

	return {
		value: preview_token,
		host:
			ctx.host ??
			(worker.name
				? `${
						worker.name
						// TODO: this should also probably have the env prefix
						// but it doesn't appear to work yet, instead giving us the
						// "There is nothing here yet" screen
						// ctx.env && !ctx.legacyEnv
						//   ? `${ctx.env}.${worker.name}`
						//   : worker.name
				  }.${host.split(".").slice(1).join(".")}`
				: host),

		inspectorUrl,
		prewarmUrl,
	};
}

/**
 * A stub to create a Cloudflare Worker preview.
 *
 * @example
 * const {value, host} = await createWorker(init, acct);
 */
export async function createWorkerPreview(
	init: CfWorkerInit,
	account: CfAccount,
	ctx: CfWorkerContext,
	session: CfPreviewSession,
	abortSignal: AbortSignal
): Promise<CfPreviewToken> {
	const token = await createPreviewToken(
		account,
		init,
		ctx,
		session,
		abortSignal
	);
	const accessToken = await getAccessToken(token.prewarmUrl.hostname);

	const headers: HeadersInit = { "cf-workers-preview-token": token.value };
	if (accessToken) {
		headers.cookie = `CF_Authorization=${accessToken}`;
	}

	// fire and forget the prewarm call
	fetch(token.prewarmUrl.href, {
		method: "POST",
		signal: abortSignal,
		headers,
	}).then(
		(response) => {
			if (!response.ok) {
				logger.warn("worker failed to prewarm: ", response.statusText);
			}
		},
		(err) => {
			if ((err as { code: string }).code !== "ABORT_ERR") {
				logger.warn("worker failed to prewarm: ", err);
			}
		}
	);

	return token;
}
