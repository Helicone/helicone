export type Awaitable<T> = T | Promise<T>;
// TODO: allow dispatching more events?
export type Dispatcher = (
	type: "scheduled",
	init: { cron?: string }
) => Awaitable<void>;

export interface MiddlewareContext {
	dispatch: Dispatcher;
	next(request: Request, env: any): Awaitable<Response>;
}

export type Middleware = (
	request: Request,
	env: any,
	ctx: ExecutionContext,
	middlewareCtx: MiddlewareContext
) => Awaitable<Response>;

const __facade_middleware__: Middleware[] = [];

// The register functions allow for the insertion of one or many middleware,
// We register internal middleware first in the stack, but have no way of controlling
// the order that addMiddleware is run in service workers so need an internal function.
export function __facade_register__(...args: (Middleware | Middleware[])[]) {
	__facade_middleware__.push(...args.flat());
}
export function __facade_registerInternal__(
	...args: (Middleware | Middleware[])[]
) {
	__facade_middleware__.unshift(...args.flat());
}

function __facade_invokeChain__(
	request: Request,
	env: any,
	ctx: ExecutionContext,
	dispatch: Dispatcher,
	middlewareChain: Middleware[]
): Awaitable<Response> {
	const [head, ...tail] = middlewareChain;
	const middlewareCtx: MiddlewareContext = {
		dispatch,
		next(newRequest, newEnv) {
			return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
		},
	};
	return head(request, env, ctx, middlewareCtx);
}

export function __facade_invoke__(
	request: Request,
	env: any,
	ctx: ExecutionContext,
	dispatch: Dispatcher,
	finalMiddleware: Middleware
): Awaitable<Response> {
	return __facade_invokeChain__(request, env, ctx, dispatch, [
		...__facade_middleware__,
		finalMiddleware,
	]);
}
