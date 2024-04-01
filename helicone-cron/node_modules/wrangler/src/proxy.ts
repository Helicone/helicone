import { createServer as createHttpServer } from "node:http";
import { connect } from "node:http2";
import { createServer as createHttpsServer } from "node:https";
import https from "node:https";
import { networkInterfaces } from "node:os";
import { createHttpTerminator } from "http-terminator";
import { useEffect, useRef, useState } from "react";
import serveStatic from "serve-static";
import { getHttpsOptions } from "./https-options";
import { logger } from "./logger";
import { getAccessToken } from "./user/access";
import type { CfPreviewToken } from "./create-worker-preview";
import type { HttpTerminator } from "http-terminator";
import type {
	IncomingHttpHeaders,
	RequestListener,
	IncomingMessage,
	ServerResponse,
	Server as HttpServer,
} from "node:http";
import type { ClientHttp2Session, ServerHttp2Stream } from "node:http2";
import type { Server as HttpsServer } from "node:https";
import type { Duplex, Writable } from "node:stream";

/**
 * `usePreviewServer` is a React hook that creates a local development
 * server that can be used to develop a Worker.
 *
 * When we run `wrangler dev`, we start by uploading the compiled worker
 * to the preview service, which responds with a preview token.
 * (see `useWorker`/`createWorker` for details.)
 * We can then use that token to connect to the preview server for a
 * great local development experience. Further, as we change the worker,
 * we can update the preview token transparently without having to restart
 * the development server.
 */

/** Rewrite request headers to add the preview token. */
function addCfPreviewTokenHeader(
	headers: IncomingHttpHeaders,
	previewTokenValue: string
) {
	headers["cf-workers-preview-token"] = previewTokenValue;
}

export async function addCfAccessToken(
	headers: IncomingHttpHeaders,
	domain: string,
	accessTokenRef: { current: string | undefined | null }
) {
	if (accessTokenRef.current === null) {
		return;
	}
	if (typeof accessTokenRef.current === "string") {
		headers[
			"cookie"
		] = `${headers["cookie"]};CF_Authorization=${accessTokenRef.current}`;
		return;
	}
	const token = await getAccessToken(domain);
	accessTokenRef.current = token;
	if (token)
		headers[
			"cookie"
		] = `${headers["cookie"]};CF_Authorization=${accessTokenRef.current}`;
}
/**
 * Rewrite references in request headers
 * from the preview host to the local host.
 */
function rewriteRemoteHostToLocalHostInHeaders(
	headers: IncomingHttpHeaders,
	remoteHost: string,
	localPort: number,
	localProtocol: "https" | "http"
) {
	for (const [name, value] of Object.entries(headers)) {
		// Rewrite the remote host to the local host.
		if (typeof value === "string" && value.includes(remoteHost)) {
			headers[name] = value
				.replaceAll(
					`https://${remoteHost}`,
					`${localProtocol}://localhost:${localPort}`
				)
				.replaceAll(remoteHost, `localhost:${localPort}`);
		}
	}
}

function writeHead(
	socket: Writable,
	res: Pick<
		IncomingMessage,
		"httpVersion" | "statusCode" | "statusMessage" | "headers"
	>
) {
	socket.write(
		`HTTP/${res.httpVersion} ${res.statusCode} ${res.statusMessage}\r\n`
	);
	for (const [key, values] of Object.entries(res.headers)) {
		if (Array.isArray(values)) {
			for (const value of values) socket.write(`${key}: ${value}\r\n`);
		} else {
			socket.write(`${key}: ${values}\r\n`);
		}
	}
	socket.write("\r\n");
}

type PreviewProxy = {
	server: HttpServer | HttpsServer;
	terminator: HttpTerminator;
};

export async function startPreviewServer({
	previewToken,
	assetDirectory,
	localProtocol,
	localPort: port,
	ip,
	onReady,
}: {
	previewToken: CfPreviewToken;
	assetDirectory: string | undefined;
	localProtocol: "https" | "http";
	localPort: number;
	ip: string;
	onReady: ((readyIp: string, readyPort: number) => void) | undefined;
}) {
	try {
		const abortController = new AbortController();

		const server = await createProxyServer(localProtocol);
		const proxy = {
			server,
			terminator: createHttpTerminator({
				server,
				gracefulTerminationTimeout: 0,
			}),
		};

		// We have a token. Let's proxy requests to the preview end point.
		const streamBufferRef = { current: [] };
		const requestResponseBufferRef = { current: [] };
		const accessTokenRef = { current: undefined };
		const cleanupListeners = configureProxyServer({
			proxy,
			previewToken,
			streamBufferRef,
			requestResponseBufferRef,
			retryServerSetup: () => {}, // no-op outside of React
			assetDirectory,
			localProtocol,
			port,
			accessTokenRef,
		});

		await waitForPortToBeAvailable(port, {
			retryPeriod: 200,
			timeout: 2000,
			abortSignal: abortController.signal,
		});

		proxy.server.on("listening", () => {
			const address = proxy.server.address();
			const usedPort =
				address && typeof address === "object" ? address.port : port;
			logger.log(`⬣ Listening at ${localProtocol}://${ip}:${usedPort}`);
			const accessibleHosts = ip !== "0.0.0.0" ? [ip] : getAccessibleHosts();
			for (const accessibleHost of accessibleHosts) {
				logger.log(`- ${localProtocol}://${accessibleHost}:${usedPort}`);
			}
			onReady?.(ip, usedPort);
		});

		proxy.server.listen(port, ip);
		return {
			stop: () => {
				abortController.abort();
				cleanupListeners?.forEach((cleanup) => cleanup());
			},
		};
	} catch (err) {
		if ((err as { code: string }).code !== "ABORT_ERR") {
			logger.error(`Failed to start server: ${err}`);
		}
		logger.error("Failed to create proxy server:", err);
	}
}

export function usePreviewServer({
	previewToken,
	assetDirectory,
	localProtocol,
	localPort: port,
	ip,
}: {
	previewToken: CfPreviewToken | undefined;
	assetDirectory: string | undefined;
	localProtocol: "https" | "http";
	localPort: number;
	ip: string;
}) {
	/** Creates an HTTP/1 proxy that sends requests over HTTP/2. */
	const [proxy, setProxy] = useState<PreviewProxy>();

	/**
	 * Create the instance of the local proxy server that will pass on
	 * requests to the preview worker.
	 */
	useEffect(() => {
		if (proxy === undefined) {
			createProxyServer(localProtocol)
				.then((server) => {
					setProxy({
						server,
						terminator: createHttpTerminator({
							server,
							gracefulTerminationTimeout: 0,
						}),
					});
				})
				.catch(async (err) => {
					logger.error("Failed to create proxy server:", err);
				});
		}
	}, [proxy, localProtocol]);

	/**
	 * When we're not connected / getting a fresh token on changes,
	 * we'd like to buffer streams/requests until we're connected.
	 * Once connected, we can flush the buffered streams/requests.
	 * streamBufferRef is used to buffer http/2 streams, while
	 * requestResponseBufferRef is used to buffer http/1 requests.
	 */
	const streamBufferRef = useRef<
		{ stream: ServerHttp2Stream; headers: IncomingHttpHeaders }[]
	>([]);
	const requestResponseBufferRef = useRef<
		{ request: IncomingMessage; response: ServerResponse }[]
	>([]);
	const accessTokenRef = useRef<string | undefined | null>(undefined);

	/**
	 * The session doesn't last forever, and will eventually drop
	 * (usually within 5-15 minutes). When that happens, we simply
	 * restart the effect, effectively restarting the server. We use
	 * a state sigil as an effect dependency to do so.
	 */
	const [retryServerSetupSigil, setRetryServerSetupSigil] = useState<number>(0);
	function retryServerSetup() {
		setRetryServerSetupSigil((x) => x + 1);
	}

	useEffect(() => {
		const cleanupListeners = configureProxyServer({
			proxy,
			previewToken,
			streamBufferRef,
			requestResponseBufferRef,
			retryServerSetup,
			assetDirectory,
			localProtocol,
			port,
			accessTokenRef,
		});
		return () => {
			cleanupListeners?.forEach((cleanup) => cleanup());
		};
	}, [
		previewToken,
		assetDirectory,
		port,
		localProtocol,
		proxy,
		// We use a state value as a sigil to trigger reconnecting the server.
		// It's not used inside the effect, so react-hooks/exhaustive-deps
		// doesn't complain if it's not included in the dependency array.
		// But its presence is critical, so Do NOT remove it from the dependency list.
		retryServerSetupSigil,
	]);

	// Start/stop the server whenever the
	// containing component is mounted/unmounted.
	useEffect(() => {
		const abortController = new AbortController();
		if (proxy === undefined) {
			return;
		}

		waitForPortToBeAvailable(port, {
			retryPeriod: 200,
			timeout: 2000,
			abortSignal: abortController.signal,
		})
			.then(() => {
				proxy.server.on("listening", () => {
					const address = proxy.server.address();
					const usedPort =
						address && typeof address === "object" ? address.port : port;
					logger.log(`⬣ Listening at ${localProtocol}://${ip}:${usedPort}`);
					const accessibleHosts =
						ip !== "0.0.0.0" ? [ip] : getAccessibleHosts();
					for (const accessibleHost of accessibleHosts) {
						logger.log(`- ${localProtocol}://${accessibleHost}:${usedPort}`);
					}
				});
				proxy.server.listen(port, ip);
			})
			.catch((err) => {
				if ((err as { code: string }).code !== "ABORT_ERR") {
					logger.error(`Failed to start server: ${err}`);
				}
			});

		return () => {
			abortController.abort();
			// Running `proxy.server.close()` does not close open connections, preventing the process from exiting.
			// So we use this `terminator` to close all the connections and force the server to shutdown.
			proxy.terminator
				.terminate()
				.catch(() => logger.error("Failed to terminate the proxy server."));
		};
	}, [port, ip, proxy, localProtocol]);
}

function configureProxyServer({
	proxy,
	previewToken,
	streamBufferRef,
	requestResponseBufferRef,
	retryServerSetup,
	port,
	localProtocol,
	assetDirectory,
	accessTokenRef,
}: {
	proxy: PreviewProxy | undefined;
	previewToken: CfPreviewToken | undefined;
	// normally the type of streamBufferRef should be
	// React.MutableRefObject<T>, but we don't want to require react
	streamBufferRef: {
		current: { stream: ServerHttp2Stream; headers: IncomingHttpHeaders }[];
	};
	// normally the type of requestResponseBufferRef should be
	// React.MutableRefObject<T>, but we don't want to require react
	requestResponseBufferRef: {
		current: { request: IncomingMessage; response: ServerResponse }[];
	};
	retryServerSetup: () => void;
	port: number;
	localProtocol: "https" | "http";
	assetDirectory: string | undefined;
	accessTokenRef: { current: string | null | undefined };
}) {
	if (proxy === undefined) {
		return;
	}

	// If we don't have a token, that means either we're just starting up,
	// or we're refreshing the token.
	if (!previewToken) {
		const cleanupListeners: (() => void)[] = [];
		const bufferStream = (
			stream: ServerHttp2Stream,
			headers: IncomingHttpHeaders
		) => {
			// store the stream in a buffer so we can replay it later
			streamBufferRef.current.push({ stream, headers });
		};
		proxy.server.on("stream", bufferStream);
		cleanupListeners.push(() => proxy.server.off("stream", bufferStream));

		const bufferRequestResponse = (
			request: IncomingMessage,
			response: ServerResponse
		) => {
			// store the request and response in a buffer so we can replay it later
			requestResponseBufferRef.current.push({ request, response });
		};

		proxy.server.on("request", bufferRequestResponse);
		cleanupListeners.push(() =>
			proxy.server.off("request", bufferRequestResponse)
		);
		return cleanupListeners;
	}

	// We have a token. Let's proxy requests to the preview end point.
	const cleanupListeners: (() => void)[] = [];

	// create a ClientHttp2Session
	logger.debug("PREVIEW URL:", `https://${previewToken.host}`);
	const remote = connect(`https://${previewToken.host}`);
	cleanupListeners.push(() => remote.destroy());

	// As mentioned above, the session may die at any point,
	// so we need to restart the effect.
	remote.on("close", retryServerSetup);
	cleanupListeners.push(() => remote.off("close", retryServerSetup));

	/** HTTP/2 -> HTTP/2  */
	const handleStream = createStreamHandler(
		previewToken,
		remote,
		port,
		localProtocol,
		accessTokenRef
	);
	proxy.server.on("stream", handleStream);
	cleanupListeners.push(() => proxy.server.off("stream", handleStream));

	// flush and replay buffered streams
	streamBufferRef.current.forEach(
		(buffer: { stream: ServerHttp2Stream; headers: IncomingHttpHeaders }) =>
			handleStream(buffer.stream, buffer.headers)
	);
	streamBufferRef.current = [];

	/** HTTP/1 -> HTTP/2  */
	const handleRequest: RequestListener = async (
		message: IncomingMessage,
		response: ServerResponse
	) => {
		const { httpVersionMajor, headers, method, url } = message;
		if (httpVersionMajor >= 2) {
			return; // Already handled by the "stream" event.
		}
		await addCfAccessToken(headers, previewToken.host, accessTokenRef);
		addCfPreviewTokenHeader(headers, previewToken.value);
		headers[":method"] = method;
		headers[":path"] = url;
		headers[":authority"] = previewToken.host;
		headers[":scheme"] = "https";
		for (const name of Object.keys(headers)) {
			if (HTTP1_HEADERS.has(name.toLowerCase())) {
				delete headers[name];
			}
		}
		const request = message.pipe(remote.request(headers));
		logger.debug(
			"WORKER REQUEST",
			new Date().toLocaleTimeString(),
			method,
			url
		);
		logger.debug("HEADERS", JSON.stringify(headers, null, 2));
		logger.debug("PREVIEW TOKEN", previewToken);

		request.on("response", (responseHeaders) => {
			const status = responseHeaders[":status"] ?? 500;
			// log all requests to terminal
			logger.log(new Date().toLocaleTimeString(), method, url, status);

			rewriteRemoteHostToLocalHostInHeaders(
				responseHeaders,
				previewToken.host,
				port,
				localProtocol
			);
			for (const name of Object.keys(responseHeaders)) {
				if (name.startsWith(":")) {
					delete responseHeaders[name];
				}
			}
			response.writeHead(status, responseHeaders);
			request.pipe(response, { end: true });
		});
	};

	// If an asset path is defined, check the file system
	// for a file first and serve if it exists.
	const actualHandleRequest = assetDirectory
		? createHandleAssetsRequest(assetDirectory, handleRequest)
		: handleRequest;

	proxy.server.on("request", actualHandleRequest);
	cleanupListeners.push(() => proxy.server.off("request", actualHandleRequest));

	// flush and replay buffered requests
	requestResponseBufferRef.current.forEach(
		({
			request,
			response,
		}: {
			request: IncomingMessage;
			response: ServerResponse;
		}) => actualHandleRequest(request, response)
	);
	requestResponseBufferRef.current = [];

	/** HTTP/1 -> WebSocket (over HTTP/1)  */
	const handleUpgrade = async (
		originalMessage: IncomingMessage,
		originalSocket: Duplex,
		originalHead: Buffer
	) => {
		const { headers, method, url } = originalMessage;
		await addCfAccessToken(headers, previewToken.host, accessTokenRef);
		addCfPreviewTokenHeader(headers, previewToken.value);
		headers["host"] = previewToken.host;

		if (originalHead?.byteLength) originalSocket.unshift(originalHead);

		const runtimeRequest = https.request(
			{
				hostname: previewToken.host,
				path: url,
				method,
				headers,
			},
			(runtimeResponse) => {
				if (!(runtimeResponse as { upgrade?: boolean }).upgrade) {
					writeHead(originalSocket, runtimeResponse);
					runtimeResponse.pipe(originalSocket);
				}
			}
		);

		runtimeRequest.on(
			"upgrade",
			(runtimeResponse, runtimeSocket, runtimeHead) => {
				if (runtimeHead?.byteLength) runtimeSocket.unshift(runtimeHead);
				writeHead(originalSocket, {
					httpVersion: "1.1",
					statusCode: 101,
					statusMessage: "Switching Protocols",
					headers: runtimeResponse.headers,
				});
				runtimeSocket.pipe(originalSocket).pipe(runtimeSocket);
			}
		);
		originalMessage.pipe(runtimeRequest);
	};

	proxy.server.on("upgrade", handleUpgrade);
	cleanupListeners.push(() => proxy.server.off("upgrade", handleUpgrade));
	return cleanupListeners;
}

function createHandleAssetsRequest(
	assetDirectory: string,
	handleRequest: RequestListener
) {
	const handleAsset = serveStatic(assetDirectory, {
		cacheControl: false,
	});
	return (request: IncomingMessage, response: ServerResponse) => {
		handleAsset(request, response, () => {
			handleRequest(request, response);
		});
	};
}

/** A Set of headers we want to remove from HTTP/1 requests. */
const HTTP1_HEADERS = new Set([
	"host",
	"connection",
	"upgrade",
	"keep-alive",
	"proxy-connection",
	"transfer-encoding",
	"http2-settings",
]);

async function createProxyServer(
	localProtocol: "https" | "http"
): Promise<HttpServer | HttpsServer> {
	const server: HttpServer | HttpsServer =
		localProtocol === "https"
			? createHttpsServer(await getHttpsOptions())
			: createHttpServer();

	return server
		.on("upgrade", (req) => {
			// log all websocket connections
			logger.log(
				new Date().toLocaleTimeString(),
				req.method,
				req.url,
				101,
				"(WebSocket)"
			);
		})
		.on("error", (err) => {
			// log all connection errors
			logger.error(new Date().toLocaleTimeString(), err);
		});
}

function createStreamHandler(
	previewToken: CfPreviewToken,
	remote: ClientHttp2Session,
	localPort: number,
	localProtocol: "https" | "http",
	accessTokenRef: { current: string | undefined | null }
) {
	return async function handleStream(
		stream: ServerHttp2Stream,
		headers: IncomingHttpHeaders
	) {
		await addCfAccessToken(headers, previewToken.host, accessTokenRef);
		addCfPreviewTokenHeader(headers, previewToken.value);
		headers[":authority"] = previewToken.host;
		const request = stream.pipe(remote.request(headers));
		request.on("response", (responseHeaders: IncomingHttpHeaders) => {
			rewriteRemoteHostToLocalHostInHeaders(
				responseHeaders,
				previewToken.host,
				localPort,
				localProtocol
			);
			stream.respond(responseHeaders);
			request.pipe(stream, { end: true });
		});
	};
}

/**
 * A helper function that waits for a port to be available.
 */
export async function waitForPortToBeAvailable(
	port: number,
	options: { retryPeriod: number; timeout: number; abortSignal: AbortSignal }
): Promise<void> {
	return new Promise((resolve, reject) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		options.abortSignal.addEventListener("abort", () => {
			const abortError = new Error("waitForPortToBeAvailable() aborted");
			(abortError as Error & { code: string }).code = "ABORT_ERR";
			doReject(abortError);
		});

		const timeout = setTimeout(() => {
			doReject(new Error(`Timed out waiting for port ${port}`));
		}, options.timeout);

		const interval = setInterval(checkPort, options.retryPeriod);
		checkPort();

		function doResolve() {
			clearTimeout(timeout);
			clearInterval(interval);
			resolve();
		}

		function doReject(err: unknown) {
			clearInterval(interval);
			clearTimeout(timeout);
			reject(err);
		}

		function checkPort() {
			if (port === 0) {
				doResolve();
				return;
			}

			// Testing whether a port is 'available' involves simply
			// trying to make a server listen on that port, and retrying
			// until it succeeds.
			const server = createHttpServer();
			const terminator = createHttpTerminator({
				server,
				gracefulTerminationTimeout: 0, // default 1000
			});

			server.on("error", (err) => {
				// @ts-expect-error non standard property on Error
				if (err.code !== "EADDRINUSE") {
					doReject(err);
				}
			});
			server.listen(port, () =>
				terminator
					.terminate()
					.then(doResolve, () =>
						logger.error("Failed to terminate the port checker.")
					)
			);
		}
	});
}

function getAccessibleHosts(): string[] {
	const hosts: string[] = [];
	Object.values(networkInterfaces()).forEach((net) => {
		net?.forEach(({ family, address }) => {
			// @ts-expect-error the `family` property is numeric as of Node.js 18.0.0
			if (family === "IPv4" || family === 4) hosts.push(address);
		});
	});
	return hosts;
}
