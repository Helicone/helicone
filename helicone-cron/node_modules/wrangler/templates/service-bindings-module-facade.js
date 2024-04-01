import worker from "__ENTRY_POINT__";
const Workers = __WORKERS__;

export * from "__ENTRY_POINT__";

export default {
	async fetch(req, env, ctx) {
		const facadeEnv = { ...env };
		// For every Worker definition that's available,
		// create a fetcher for it on the facade env.
		// for const [name,  binding] of env
		// if Workers[name]
		// const details = Workers[name];

		for (const [name, details] of Object.entries(Workers)) {
			if (details) {
				facadeEnv[name] = {
					async fetch(...reqArgs) {
						const reqFromArgs = new Request(...reqArgs);
						if (details.headers) {
							for (const [key, value] of Object.entries(details.headers)) {
								// In remote mode, you need to add a couple of headers
								// to make sure it's talking to the 'dev' preview session
								// (much like wrangler dev already does via proxy.ts)
								reqFromArgs.headers.set(key, value);
							}
							return env[name].fetch(reqFromArgs);
						}

						const url = new URL(reqFromArgs.url);
						url.protocol = details.protocol;
						url.host = details.host;
						if (details.port !== undefined) url.port = details.port;

						const request = new Request(url.toString(), reqFromArgs);
						return fetch(request);
					},
				};
			} else {
				// This means there's no dev binding available.
				// Let's use whatever's available, or put a shim with a message.
				facadeEnv[name] = facadeEnv[name] || {
					async fetch() {
						return new Response(
							`You should start up wrangler dev --local on the ${name} worker`,
							{ status: 404 }
						);
					},
				};
			}
		}
		return worker.fetch(req, facadeEnv, ctx);
	},
};
