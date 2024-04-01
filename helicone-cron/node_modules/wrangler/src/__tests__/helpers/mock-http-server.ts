import http from "node:http";
import type { Request } from "undici";

/**
 * Setup a mock HTTP server that can be triggered directly without interacting with any network.
 *
 * @returns a `fetch`-like function that will trigger the mock server to handle the request.
 */
export function mockHttpServer() {
	let listener: http.RequestListener;

	beforeEach(() => {
		jest
			.spyOn(http, "createServer")
			.mockImplementation((...args: unknown[]) => {
				listener = args.pop() as http.RequestListener;
				return {
					listen: jest.fn(),
					close(callback?: (err?: Error) => void) {
						callback?.();
						return this;
					},
				} as unknown as http.Server;
			});
	});

	return async (req: Request) => {
		const resp = new http.ServerResponse(
			// If you squint you can just about see that an `IncomingMessages` is like a `Request`!
			req as unknown as http.IncomingMessage
		);

		// The listener will attache a callback to the response by calling `resp.end(callback)`.
		// We want to capture that so that we can trigger it after the listener has completed its work.
		const endSpy = jest.spyOn(resp, "end");

		// The `await` here is important to allow the listener to complete its async work before we end the response.
		await listener(req as unknown as http.IncomingMessage, resp);

		// Now trigger the end callback.
		const endCallback = endSpy.mock.calls[0].pop();
		endCallback?.();

		return resp;
	};
}
