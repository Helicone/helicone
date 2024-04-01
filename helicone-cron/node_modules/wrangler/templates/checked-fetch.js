const urls = new Set();

export function checkedFetch(request, init) {
	const url = new URL(
		(typeof request === "string" ? new Request(request, init) : request).url
	);
	if (url.port && url.port !== "443" && url.protocol === "https:") {
		if (!urls.has(url.toString())) {
			urls.add(url.toString());
			console.warn(
				`WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:\n` +
					` - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler publish\` command.\n`
			);
		}
	}
	return globalThis.fetch(request, init);
}
