import { existsSync, lstatSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createMetadataObject } from "@cloudflare/pages-shared/metadata-generator/createMetadataObject";
import { parseHeaders } from "@cloudflare/pages-shared/metadata-generator/parseHeaders";
import { parseRedirects } from "@cloudflare/pages-shared/metadata-generator/parseRedirects";
import {
	Response as MiniflareResponse,
	Request as MiniflareRequest,
} from "@miniflare/core";
import { upgradingFetch as miniflareFetch } from "@miniflare/web-sockets";
import { watch } from "chokidar";
import { getType } from "mime";
import { hashFile } from "../pages/hash";
import type { Metadata } from "@cloudflare/pages-shared/asset-server/metadata";
import type {
	fetch,
	Request,
} from "@cloudflare/pages-shared/environment-polyfills/types";
import type {
	ParsedRedirects,
	ParsedHeaders,
} from "@cloudflare/pages-shared/metadata-generator/types";
import type { RequestInfo, RequestInit, FetcherFetch } from "@miniflare/core";
import type { Log } from "miniflare";

export interface Options {
	log: Log;
	proxyPort?: number;
	directory?: string;
}

export default async function generateASSETSBinding(options: Options) {
	const assetsFetch =
		options.directory !== undefined
			? await generateAssetsFetch(options.directory, options.log)
			: invalidAssetsFetch;

	return async function (miniflareRequest: MiniflareRequest) {
		if (options.proxyPort) {
			try {
				const url = new URL(miniflareRequest.url);
				url.host = `localhost:${options.proxyPort}`;
				const proxyRequest = new MiniflareRequest(url, miniflareRequest);
				if (proxyRequest.headers.get("Upgrade") === "websocket") {
					proxyRequest.headers.delete("Sec-WebSocket-Accept");
					proxyRequest.headers.delete("Sec-WebSocket-Key");
				}
				return await miniflareFetch(proxyRequest);
			} catch (thrown) {
				options.log.error(new Error(`Could not proxy request: ${thrown}`));

				// TODO: Pretty error page
				return new MiniflareResponse(
					`[wrangler] Could not proxy request: ${thrown}`,
					{
						status: 502,
					}
				);
			}
		} else {
			try {
				return await assetsFetch(miniflareRequest);
			} catch (thrown) {
				options.log.error(new Error(`Could not serve static asset: ${thrown}`));

				// TODO: Pretty error page
				return new MiniflareResponse(
					`[wrangler] Could not serve static asset: ${thrown}`,
					{ status: 502 }
				);
			}
		}
	} as FetcherFetch;
}

async function generateAssetsFetch(
	directory: string,
	log: Log
): Promise<typeof fetch> {
	// Defer importing miniflare until we really need it
	await import("@cloudflare/pages-shared/environment-polyfills/miniflare");

	const { generateHandler, parseQualityWeightedList } = await import(
		"@cloudflare/pages-shared/asset-server/handler"
	);

	const headersFile = join(directory, "_headers");
	const redirectsFile = join(directory, "_redirects");
	const workerFile = join(directory, "_worker.js");

	const ignoredFiles = [headersFile, redirectsFile, workerFile];

	let redirects: ParsedRedirects | undefined;
	if (existsSync(redirectsFile)) {
		const contents = readFileSync(redirectsFile, "utf-8");
		redirects = parseRedirects(contents);
	}

	let headers: ParsedHeaders | undefined;
	if (existsSync(headersFile)) {
		const contents = readFileSync(headersFile, "utf-8");
		headers = parseHeaders(contents);
	}

	let metadata = createMetadataObject({
		redirects,
		headers,
		logger: log.warn.bind(log),
	});

	watch([headersFile, redirectsFile], { persistent: true }).on(
		"change",
		(path) => {
			switch (path) {
				case headersFile: {
					log.log("_headers modified. Re-evaluating...");
					const contents = readFileSync(headersFile).toString();
					headers = parseHeaders(contents);
					break;
				}
				case redirectsFile: {
					log.log("_redirects modified. Re-evaluating...");
					const contents = readFileSync(redirectsFile).toString();
					redirects = parseRedirects(contents);
					break;
				}
			}

			metadata = createMetadataObject({
				redirects,
				headers,
				logger: log.warn,
			});
		}
	);

	const generateResponse = async (request: Request) => {
		const assetKeyEntryMap = new Map<string, string>();

		return await generateHandler<string>({
			request,
			metadata: metadata as Metadata,
			xServerEnvHeader: "dev",
			logError: console.error,
			findAssetEntryForPath: async (path) => {
				const filepath = join(directory, path);

				if (
					existsSync(filepath) &&
					lstatSync(filepath).isFile() &&
					!ignoredFiles.includes(filepath)
				) {
					const hash = hashFile(filepath);
					assetKeyEntryMap.set(hash, filepath);
					return hash;
				}

				return null;
			},
			getAssetKey: (assetEntry) => {
				return assetEntry;
			},
			negotiateContent: (contentRequest) => {
				let rawAcceptEncoding: string | undefined;
				if (
					contentRequest.cf &&
					"clientAcceptEncoding" in contentRequest.cf &&
					contentRequest.cf.clientAcceptEncoding
				) {
					rawAcceptEncoding = contentRequest.cf.clientAcceptEncoding as string;
				} else {
					rawAcceptEncoding =
						contentRequest.headers.get("Accept-Encoding") || undefined;
				}

				const acceptEncoding = parseQualityWeightedList(rawAcceptEncoding);

				if (
					acceptEncoding["identity"] === 0 ||
					(acceptEncoding["*"] === 0 &&
						acceptEncoding["identity"] === undefined)
				) {
					throw new Error("No acceptable encodings available");
				}

				return { encoding: null };
			},
			fetchAsset: async (assetKey) => {
				const filepath = assetKeyEntryMap.get(assetKey);
				if (!filepath) {
					throw new Error(
						"Could not fetch asset. Please file an issue on GitHub (https://github.com/cloudflare/wrangler2/issues/new/choose) with reproduction steps."
					);
				}
				const body = readFileSync(filepath) as unknown as ReadableStream;

				let contentType = getType(filepath) || "application/octet-stream";
				if (
					contentType.startsWith("text/") &&
					!contentType.includes("charset")
				) {
					contentType = `${contentType}; charset=utf-8`;
				}

				return { body, contentType };
			},
		});
	};

	return async (input: RequestInfo, init?: RequestInit) => {
		const request = new MiniflareRequest(input, init);
		return await generateResponse(request as unknown as Request);
	};
}

const invalidAssetsFetch: typeof fetch = () => {
	throw new Error(
		"Trying to fetch assets directly when there is no `directory` option specified."
	);
};
