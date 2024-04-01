export default {
	fetch() {
		return new Response("Not found", {
			status: 404,
			headers: {
				"Content-Type": "text/html",
			},
		});
	},
};
