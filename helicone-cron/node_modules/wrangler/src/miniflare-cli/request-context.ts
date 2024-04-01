import type { MiniflareOptions } from "miniflare";

/**
 * Certain runtime APIs are only available to workers during the "request context",
 * which is any code that returns after receiving a request and before returning
 * a response.
 *
 * Miniflare emulates this behavior by using an [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html#class-asynclocalstorage) and
 * [checking at runtime](https://github.com/cloudflare/miniflare/blob/master/packages/shared/src/context.ts#L21-L36)
 * to see if you're using those APIs during the request context.
 *
 * In certain environments `AsyncLocalStorage` is unavailable, such as in a
 * [webcontainer](https://github.com/stackblitz/webcontainer-core).
 * This function figures out if we're able to run those "request context" checks
 * and returns [a set of options](https://miniflare.dev/core/standards#global-functionality-limits)
 * that indicate to miniflare whether to run the checks or not.
 */
export const getRequestContextCheckOptions = async (): Promise<
	Pick<MiniflareOptions, "globalAsyncIO" | "globalTimers" | "globalRandom">
> => {
	// check that there's an implementation of AsyncLocalStorage
	let hasAsyncLocalStorage = true;
	try {
		// ripped from  the example here https://nodejs.org/api/async_context.html#class-asynclocalstorage
		const { AsyncLocalStorage } = await import("node:async_hooks");
		const storage = new AsyncLocalStorage<string>();

		hasAsyncLocalStorage = storage.run("some-value", () => {
			return storage.getStore() === "some-value";
		});
	} catch (e) {
		hasAsyncLocalStorage = false;
	}

	return {
		globalAsyncIO: hasAsyncLocalStorage,
		globalRandom: hasAsyncLocalStorage,
		globalTimers: hasAsyncLocalStorage,
	};
};
