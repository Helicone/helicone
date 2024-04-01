import {
	Awaitable,
	Dispatcher,
	Middleware,
	__facade_invoke__,
	__facade_register__,
	__facade_registerInternal__,
} from "./common";
export { __facade_register__, __facade_registerInternal__ };

// Miniflare 2's `EventTarget` follows the spec and doesn't allow exceptions to
// be caught by `dispatchEvent`. Instead it has a custom `ThrowingEventTarget`
// class that rethrows errors from event listeners in `dispatchEvent`.
// We'd like errors to be propagated to the top-level `addEventListener`, so
// we'd like to use `ThrowingEventTarget`. Unfortunately, `ThrowingEventTarget`
// isn't exposed on the global scope, but `WorkerGlobalScope` (which extends
// `ThrowingEventTarget`) is. Therefore, we get at it in this nasty way.
let __FACADE_EVENT_TARGET__: EventTarget;
if ((globalThis as any).MINIFLARE) {
	__FACADE_EVENT_TARGET__ = new (Object.getPrototypeOf(WorkerGlobalScope))();
} else {
	__FACADE_EVENT_TARGET__ = new EventTarget();
}

function __facade_isSpecialEvent__(
	type: string
): type is "fetch" | "scheduled" {
	return type === "fetch" || type === "scheduled";
}
const __facade__originalAddEventListener__ = globalThis.addEventListener;
const __facade__originalRemoveEventListener__ = globalThis.removeEventListener;
const __facade__originalDispatchEvent__ = globalThis.dispatchEvent;

globalThis.addEventListener = function (type, listener, options) {
	if (__facade_isSpecialEvent__(type)) {
		__FACADE_EVENT_TARGET__.addEventListener(
			type,
			listener as EventListenerOrEventListenerObject,
			options
		);
	} else {
		__facade__originalAddEventListener__(type, listener, options);
	}
};
globalThis.removeEventListener = function (type, listener, options) {
	if (__facade_isSpecialEvent__(type)) {
		__FACADE_EVENT_TARGET__.removeEventListener(
			type,
			listener as EventListenerOrEventListenerObject,
			options
		);
	} else {
		__facade__originalRemoveEventListener__(type, listener, options);
	}
};
globalThis.dispatchEvent = function (event) {
	if (__facade_isSpecialEvent__(event.type)) {
		return __FACADE_EVENT_TARGET__.dispatchEvent(event);
	} else {
		return __facade__originalDispatchEvent__(event);
	}
};

declare global {
	var addMiddleware: typeof __facade_register__;
	var addMiddlewareInternal: typeof __facade_registerInternal__;
}
globalThis.addMiddleware = __facade_register__;
globalThis.addMiddlewareInternal = __facade_registerInternal__;

const __facade_waitUntil__ = Symbol("__facade_waitUntil__");
const __facade_response__ = Symbol("__facade_response__");
const __facade_dispatched__ = Symbol("__facade_dispatched__");

class __Facade_ExtendableEvent__ extends Event {
	[__facade_waitUntil__]: Awaitable<unknown>[] = [];

	waitUntil(promise: Awaitable<any>) {
		if (!(this instanceof __Facade_ExtendableEvent__)) {
			throw new TypeError("Illegal invocation");
		}
		this[__facade_waitUntil__].push(promise);
	}
}

interface FetchEventInit extends EventInit {
	request: Request;
	passThroughOnException: FetchEvent["passThroughOnException"];
}

class __Facade_FetchEvent__ extends __Facade_ExtendableEvent__ {
	#request: Request;
	#passThroughOnException: FetchEvent["passThroughOnException"];
	[__facade_response__]?: Awaitable<Response>;
	[__facade_dispatched__] = false;

	constructor(type: "fetch", init: FetchEventInit) {
		super(type);
		this.#request = init.request;
		this.#passThroughOnException = init.passThroughOnException;
	}

	get request() {
		return this.#request;
	}

	respondWith(response: Awaitable<Response>) {
		if (!(this instanceof __Facade_FetchEvent__)) {
			throw new TypeError("Illegal invocation");
		}
		if (this[__facade_response__] !== undefined) {
			throw new DOMException(
				"FetchEvent.respondWith() has already been called; it can only be called once.",
				"InvalidStateError"
			);
		}
		if (this[__facade_dispatched__]) {
			throw new DOMException(
				"Too late to call FetchEvent.respondWith(). It must be called synchronously in the event handler.",
				"InvalidStateError"
			);
		}
		this.stopImmediatePropagation();
		this[__facade_response__] = response;
	}

	passThroughOnException() {
		if (!(this instanceof __Facade_FetchEvent__)) {
			throw new TypeError("Illegal invocation");
		}
		// Need to call native method immediately in case uncaught error thrown
		this.#passThroughOnException();
	}
}

interface ScheduledEventInit extends EventInit {
	scheduledTime: number;
	cron: string;
	noRetry: ScheduledEvent["noRetry"];
}

class __Facade_ScheduledEvent__ extends __Facade_ExtendableEvent__ {
	#scheduledTime: number;
	#cron: string;
	#noRetry: ScheduledEvent["noRetry"];

	constructor(type: "scheduled", init: ScheduledEventInit) {
		super(type);
		this.#scheduledTime = init.scheduledTime;
		this.#cron = init.cron;
		this.#noRetry = init.noRetry;
	}

	get scheduledTime() {
		return this.#scheduledTime;
	}

	get cron() {
		return this.#cron;
	}

	noRetry() {
		if (!(this instanceof __Facade_ScheduledEvent__)) {
			throw new TypeError("Illegal invocation");
		}
		// Need to call native method immediately in case uncaught error thrown
		this.#noRetry();
	}
}

__facade__originalAddEventListener__("fetch", (event) => {
	const ctx: ExecutionContext = {
		waitUntil: event.waitUntil.bind(event),
		passThroughOnException: event.passThroughOnException.bind(event),
	};

	const __facade_sw_dispatch__: Dispatcher = function (type, init) {
		if (type === "scheduled") {
			const facadeEvent = new __Facade_ScheduledEvent__("scheduled", {
				scheduledTime: Date.now(),
				cron: init.cron ?? "",
				noRetry() {},
			});

			__FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
			event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));
		}
	};

	const __facade_sw_fetch__: Middleware = function (request, _env, ctx) {
		const facadeEvent = new __Facade_FetchEvent__("fetch", {
			request,
			passThroughOnException: ctx.passThroughOnException,
		});

		__FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
		facadeEvent[__facade_dispatched__] = true;
		event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));

		const response = facadeEvent[__facade_response__];
		if (response === undefined) {
			throw new Error("No response!"); // TODO: proper error message
		}
		return response;
	};

	event.respondWith(
		__facade_invoke__(
			event.request,
			globalThis,
			ctx,
			__facade_sw_dispatch__,
			__facade_sw_fetch__
		)
	);
});

__facade__originalAddEventListener__("scheduled", (event) => {
	const facadeEvent = new __Facade_ScheduledEvent__("scheduled", {
		scheduledTime: event.scheduledTime,
		cron: event.cron,
		noRetry: event.noRetry.bind(event),
	});

	__FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
	event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));
});
