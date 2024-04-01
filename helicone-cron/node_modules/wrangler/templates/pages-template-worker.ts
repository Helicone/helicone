import { match } from "path-to-regexp";

//note: this explicitly does not include the * character, as pages requires this
const escapeRegex = /[.+?^${}()|[\]\\]/g;

type HTTPMethod =
	| "HEAD"
	| "OPTIONS"
	| "GET"
	| "POST"
	| "PUT"
	| "PATCH"
	| "DELETE";

/* TODO: Grab these from @cloudflare/workers-types instead */
type Params<P extends string = string> = Record<P, string | string[]>;

type EventContext<Env, P extends string, Data> = {
	request: Request;
	functionPath: string;
	waitUntil: (promise: Promise<unknown>) => void;
	passThroughOnException: () => void;
	next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
	env: Env & { ASSETS: { fetch: typeof fetch } };
	params: Params<P>;
	data: Data;
};

declare type PagesFunction<
	Env = unknown,
	P extends string = string,
	Data extends Record<string, unknown> = Record<string, unknown>
> = (context: EventContext<Env, P, Data>) => Response | Promise<Response>;
/* end @cloudflare/workers-types */

type RouteHandler = {
	routePath: string;
	mountPath: string;
	method?: HTTPMethod;
	modules: PagesFunction[];
	middlewares: PagesFunction[];
};

// inject `routes` via ESBuild
declare const routes: RouteHandler[];
// define `__FALLBACK_SERVICE__` via ESBuild
declare const __FALLBACK_SERVICE__: string;

// expect an ASSETS fetcher binding pointing to the asset-server stage
type FetchEnv = {
	[name: string]: { fetch: typeof fetch };
	ASSETS: { fetch: typeof fetch };
};

type WorkerContext = {
	waitUntil: (promise: Promise<unknown>) => void;
	passThroughOnException: () => void;
};

function* executeRequest(request: Request) {
	const requestPath = new URL(request.url).pathname;

	// First, iterate through the routes (backwards) and execute "middlewares" on partial route matches
	for (const route of [...routes].reverse()) {
		if (route.method && route.method !== request.method) {
			continue;
		}

		// replaces with "\\$&", this prepends a backslash to the matched string, e.g. "[" becomes "\["
		const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
			end: false,
		});
		const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
			end: false,
		});
		const matchResult = routeMatcher(requestPath);
		const mountMatchResult = mountMatcher(requestPath);
		if (matchResult && mountMatchResult) {
			for (const handler of route.middlewares.flat()) {
				yield {
					handler,
					params: matchResult.params as Params,
					path: mountMatchResult.path,
				};
			}
		}
	}

	// Then look for the first exact route match and execute its "modules"
	for (const route of routes) {
		if (route.method && route.method !== request.method) {
			continue;
		}
		const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
			end: true,
		});
		const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
			end: false,
		});
		const matchResult = routeMatcher(requestPath);
		const mountMatchResult = mountMatcher(requestPath);
		if (matchResult && mountMatchResult && route.modules.length) {
			for (const handler of route.modules.flat()) {
				yield {
					handler,
					params: matchResult.params as Params,
					path: matchResult.path,
				};
			}
			break;
		}
	}
}

export default {
	async fetch(
		originalRequest: Request,
		env: FetchEnv,
		workerContext: WorkerContext
	) {
		let request = originalRequest;
		const handlerIterator = executeRequest(request);
		const data = {}; // arbitrary data the user can set between functions
		let isFailOpen = false;

		const next = async (input?: RequestInfo, init?: RequestInit) => {
			if (input !== undefined) {
				let url = input;
				if (typeof input === "string") {
					url = new URL(input, request.url).toString();
				}
				request = new Request(url, init);
			}

			const result = handlerIterator.next();
			// Note we can't use `!result.done` because this doesn't narrow to the correct type
			if (result.done === false) {
				const { handler, params, path } = result.value;
				const context = {
					request: new Request(request.clone()),
					functionPath: path,
					next,
					params,
					data,
					env,
					waitUntil: workerContext.waitUntil.bind(workerContext),
					passThroughOnException: () => {
						isFailOpen = true;
					},
				};

				const response = await handler(context);

				if (!(response instanceof Response)) {
					throw new Error("Your Pages function should return a Response");
				}

				return cloneResponse(response);
			} else if (__FALLBACK_SERVICE__) {
				// There are no more handlers so finish with the fallback service (`env.ASSETS.fetch` in Pages' case)
				const response = await env[__FALLBACK_SERVICE__].fetch(request);
				return cloneResponse(response);
			} else {
				// There was not fallback service so actually make the request to the origin.
				const response = await fetch(request);
				return cloneResponse(response);
			}
		};

		try {
			return await next();
		} catch (error) {
			if (isFailOpen) {
				const response = await env[__FALLBACK_SERVICE__].fetch(request);
				return cloneResponse(response);
			}

			throw error;
		}
	},
};

// This makes a Response mutable
const cloneResponse = (response: Response) =>
	// https://fetch.spec.whatwg.org/#null-body-status
	new Response(
		[101, 204, 205, 304].includes(response.status) ? null : response.body,
		response
	);
