import type { Middleware } from "./common";

// See comment in `bundle.ts` for details on why this is needed
const jsonError: Middleware = async (request, env, _ctx, middlewareCtx) => {
	try {
		return await middlewareCtx.next(request, env);
	} catch (e: any) {
		const error = {
			name: e?.name,
			message: e?.message ?? String(e),
			stack: e?.stack,
		};
		return Response.json(error, {
			status: 500,
			headers: { "MF-Experimental-Error-Stack": "true" },
		});
	}
};

export default jsonError;
