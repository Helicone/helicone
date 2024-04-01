import type { Middleware } from "./common";

// A middleware has to be a function of type Middleware
const scheduled: Middleware = async (request, env, _ctx, middlewareCtx) => {
	const url = new URL(request.url);
	if (url.pathname === "/__scheduled") {
		const cron = url.searchParams.get("cron") ?? "";
		await middlewareCtx.dispatch("scheduled", { cron });

		return new Response("Ran scheduled event");
	}
	return middlewareCtx.next(request, env);
};

export default scheduled;
