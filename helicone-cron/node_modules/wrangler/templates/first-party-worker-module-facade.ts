// @ts-ignore entry point will get replaced
import worker from "__ENTRY_POINT__";
// @ts-ignore entry point will get replaced
export * from "__ENTRY_POINT__";

type Env = {
	// TODO: type this
};

/**
 * Setup globals/vars as required
 */

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		return worker.fetch(request, env, ctx);
	},
};
