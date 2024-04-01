// This Worker is used as a default when no Pages Functions are present.
// It proxies the request directly on to the asset server binding.

export default {
	async fetch(request, env, context) {
		const response = await env.ASSETS.fetch(request.url, request);
		return new Response(response.body, response);
	},
};
