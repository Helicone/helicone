export default {
	async fetch(req, env) {
		const resp = await env.CHILD.fetch(req);
		const text = await resp.text();
		console.log("text: ", text);
		return new Response(`Parent worker sees: ${text}`);
	},
};
