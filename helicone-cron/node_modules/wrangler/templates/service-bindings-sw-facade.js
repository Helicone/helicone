import "__ENTRY_POINT__";
const Workers = __WORKERS__;

// For every Worker definition that's available,
// create a fetcher for it on the facade env.
for (const [name, details] of Object.entries(Workers)) {
	if (details) {
		globalThis[name] = {
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
		// This means it's a local mode binding
		// but hasn't started up locally yet.
		globalThis[name] = {
			async fetch() {
				return new Response(
					`You should start up wrangler dev --local on the ${name} worker`,
					{ status: 404 }
				);
			},
		};
	}
}
