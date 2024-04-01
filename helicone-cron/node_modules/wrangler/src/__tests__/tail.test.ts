import MockWebSocket from "jest-websocket-mock";
import { rest } from "msw";
import { Headers, Request } from "undici";
import { mockAccountId, mockApiToken } from "./helpers/mock-account-id";
import { mockConsoleMethods } from "./helpers/mock-console";
import { useMockIsTTY } from "./helpers/mock-istty";
import { msw, mswSucessScriptHandlers } from "./helpers/msw";
import { runInTempDir } from "./helpers/run-in-tmp";
import { runWrangler } from "./helpers/run-wrangler";
import type {
	TailEventMessage,
	RequestEvent,
	ScheduledEvent,
	AlarmEvent,
} from "../tail/createTail";
import type { RequestInit } from "undici";
import type WebSocket from "ws";

describe("tail", () => {
	beforeEach(() => msw.use(...mswSucessScriptHandlers));
	runInTempDir();
	mockAccountId();
	mockApiToken();

	const std = mockConsoleMethods();

	afterEach(() => {
		mockWebSockets.forEach((ws) => ws.close());
		mockWebSockets.splice(0);
	});

	/**
	 * Interaction with the tailing API, including tail creation,
	 * deletion, and connection.
	 */
	describe("API interaction", () => {
		const { setIsTTY } = useMockIsTTY();
		it("should throw an error if name isn't provided", async () => {
			await expect(
				runWrangler("tail")
			).rejects.toThrowErrorMatchingInlineSnapshot(
				`"Required Worker name missing. Please specify the Worker name in wrangler.toml, or pass it as an argument with \`wrangler tail <worker-name>\`"`
			);
		});
		it("warns about durable object restarts for tty", async () => {
			setIsTTY(true);
			const api = mockWebsocketAPIs();
			expect(api.requests.creation.length).toStrictEqual(0);
			await runWrangler("tail durable-object--websocket--response");
			expect(std.out).toMatchInlineSnapshot(`""`);
			expect(std.warn).toMatchInlineSnapshot(`
"[33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mBeginning log collection requires restarting the Durable Objects associated with durable-object--websocket--response. Any WebSocket connections or other non-persisted state will be lost as part of this restart.[0m

"
`);
			expect(std.err).toMatchInlineSnapshot(`""`);
		});
		it("creates and then delete tails", async () => {
			const api = mockWebsocketAPIs();
			expect(api.requests.creation.length).toStrictEqual(0);

			await runWrangler("tail test-worker");

			await expect(api.ws.connected).resolves.toBeTruthy();
			expect(api.requests.creation.length).toStrictEqual(1);
			expect(api.requests.deletion.count).toStrictEqual(0);

			await api.closeHelper();
			expect(api.requests.deletion.count).toStrictEqual(1);
		});
		it("should connect to the worker assigned to a given route", async () => {
			const api = mockWebsocketAPIs();
			expect(api.requests.creation.length).toStrictEqual(0);

			msw.use(
				rest.get(`*/zones`, (req, res, ctx) => {
					expect(req.url.searchParams.get("name")).toBe("example.com");
					return res.once(
						ctx.status(200),
						ctx.json({
							success: true,
							errors: [],
							messages: [],
							result: [{ id: "test-zone" }],
						})
					);
				})
			);
			msw.use(
				rest.get(`*/zones/:zoneId/workers/routes`, (req, res, ctx) => {
					return res.once(
						ctx.status(200),
						ctx.json({
							success: true,
							errors: [],
							messages: [],
							result: [
								{
									pattern: "example.com/*",
									script: "test-worker",
								},
							],
						})
					);
				})
			);
			await runWrangler("tail example.com/*");

			await expect(api.ws.connected).resolves.toBeTruthy();
			expect(api.requests.creation.length).toStrictEqual(1);
			expect(api.requests.deletion.count).toStrictEqual(0);

			await api.closeHelper();
			expect(api.requests.deletion.count).toStrictEqual(1);
		});

		it("should error if a given route is not assigned to the user's zone", async () => {
			msw.use(
				rest.get(`*/zones`, (req, res, ctx) => {
					expect(req.url.searchParams.get("name")).toBe("example.com");
					return res.once(
						ctx.status(200),
						ctx.json({
							success: true,
							errors: [],
							messages: [],
							result: [{ id: "test-zone" }],
						})
					);
				})
			);
			msw.use(
				rest.get(`*/zones/:zoneId/workers/routes`, (req, res, ctx) => {
					return res.once(
						ctx.status(200),
						ctx.json({
							success: true,
							errors: [],
							messages: [],
							result: [],
						})
					);
				})
			);

			await expect(runWrangler("tail example.com/*")).rejects.toThrow();
		});
		it("should error if a given route is not within the user's zone", async () => {
			msw.use(
				rest.get(`*/zones`, (req, res, ctx) => {
					expect(req.url.searchParams.get("name")).toBe("example.com");
					return res.once(
						ctx.status(200),
						ctx.json({
							success: true,
							errors: [],
							messages: [],
							result: [],
						})
					);
				})
			);

			await expect(runWrangler("tail example.com/*")).rejects.toThrow();
		});

		it("creates and then delete tails: legacy envs", async () => {
			const api = mockWebsocketAPIs("some-env", true);
			expect(api.requests.creation.length).toStrictEqual(0);

			await runWrangler("tail test-worker --env some-env --legacy-env true");

			await expect(api.ws.connected).resolves.toBeTruthy();
			expect(api.requests.creation.length).toStrictEqual(1);
			expect(api.requests.deletion.count).toStrictEqual(0);

			await api.closeHelper();
			expect(api.requests.deletion.count).toStrictEqual(1);
		});

		it("creates and then delete tails: service envs", async () => {
			const api = mockWebsocketAPIs("some-env");
			expect(api.requests.creation.length).toStrictEqual(0);

			await runWrangler("tail test-worker --env some-env --legacy-env false");

			await expect(api.ws.connected).resolves.toBeTruthy();
			expect(api.requests.creation.length).toStrictEqual(1);
			expect(api.requests.deletion.count).toStrictEqual(0);

			await api.closeHelper();
			expect(api.requests.deletion.count).toStrictEqual(1);
		});

		it("errors when the websocket closes unexpectedly", async () => {
			const api = mockWebsocketAPIs();
			await api.closeHelper();

			await expect(runWrangler("tail test-worker")).rejects.toThrow();
		});

		it("activates debug mode when the cli arg is passed in", async () => {
			const api = mockWebsocketAPIs();
			await runWrangler("tail test-worker --debug");
			await expect(api.nextMessageJson()).resolves.toHaveProperty(
				"debug",
				true
			);
		});
	});

	describe("filtering", () => {
		it("sends sampling rate filters", async () => {
			const api = mockWebsocketAPIs();
			const tooHigh = runWrangler("tail test-worker --sampling-rate 10");
			await expect(tooHigh).rejects.toThrow();

			const tooLow = runWrangler("tail test-worker --sampling-rate -5");
			await expect(tooLow).rejects.toThrow();

			await runWrangler("tail test-worker --sampling-rate 0.25");

			expect(api.requests.creation[0]).toEqual({
				filters: [{ sampling_rate: 0.25 }],
			});
		});

		it("sends single status filters", async () => {
			const api = mockWebsocketAPIs();
			await runWrangler("tail test-worker --status error");
			expect(api.requests.creation[0]).toEqual({
				filters: [
					{
						outcome: ["exception", "exceededCpu", "exceededMemory", "unknown"],
					},
				],
			});
		});

		it("sends multiple status filters", async () => {
			const api = mockWebsocketAPIs();
			await runWrangler("tail test-worker --status error --status canceled");
			expect(api.requests.creation[0]).toEqual({
				filters: [
					{
						outcome: [
							"exception",
							"exceededCpu",
							"exceededMemory",
							"unknown",
							"canceled",
						],
					},
				],
			});
		});

		it("sends single HTTP method filters", async () => {
			const api = mockWebsocketAPIs();
			await runWrangler("tail test-worker --method POST");
			expect(api.requests.creation[0]).toEqual({
				filters: [{ method: ["POST"] }],
			});
		});

		it("sends multiple HTTP method filters", async () => {
			const api = mockWebsocketAPIs();
			await runWrangler("tail test-worker --method POST --method GET");
			expect(api.requests.creation[0]).toEqual({
				filters: [{ method: ["POST", "GET"] }],
			});
		});

		it("sends header filters without a query", async () => {
			const api = mockWebsocketAPIs();
			await runWrangler("tail test-worker --header X-CUSTOM-HEADER");
			expect(api.requests.creation[0]).toEqual({
				filters: [{ header: { key: "X-CUSTOM-HEADER" } }],
			});
		});

		it("sends header filters with a query", async () => {
			const api = mockWebsocketAPIs();
			await runWrangler("tail test-worker --header X-CUSTOM-HEADER:some-value");
			expect(api.requests.creation[0]).toEqual({
				filters: [{ header: { key: "X-CUSTOM-HEADER", query: "some-value" } }],
			});
		});

		it("sends single IP filters", async () => {
			const api = mockWebsocketAPIs();
			const fakeIp = "192.0.2.1";

			await runWrangler(`tail test-worker --ip ${fakeIp}`);
			expect(api.requests.creation[0]).toEqual({
				filters: [{ client_ip: [fakeIp] }],
			});
		});

		it("sends multiple IP filters", async () => {
			const api = mockWebsocketAPIs();
			const fakeIp = "192.0.2.1";

			await runWrangler(`tail test-worker --ip ${fakeIp} --ip self`);
			expect(api.requests.creation[0]).toEqual({
				filters: [{ client_ip: [fakeIp, "self"] }],
			});
		});

		it("sends search filters", async () => {
			const api = mockWebsocketAPIs();
			const search = "filterMe";

			await runWrangler(`tail test-worker --search ${search}`);
			expect(api.requests.creation[0]).toEqual({
				filters: [{ query: search }],
			});
		});

		it("sends everything but the kitchen sink", async () => {
			const api = mockWebsocketAPIs();
			const sampling_rate = 0.69;
			const status = ["ok", "error"];
			const method = ["GET", "POST", "PUT"];
			const header = "X-HELLO:world";
			const client_ip = ["192.0.2.1", "self"];
			const query = "onlyTheseMessagesPlease";

			const cliFilters =
				`--sampling-rate ${sampling_rate} ` +
				status.map((s) => `--status ${s} `).join("") +
				method.map((m) => `--method ${m} `).join("") +
				`--header ${header} ` +
				client_ip.map((c) => `--ip ${c} `).join("") +
				`--search ${query} ` +
				`--debug`;

			const expectedWebsocketMessage = {
				filters: [
					{ sampling_rate: 0.69 },
					{
						outcome: [
							"ok",
							"exception",
							"exceededCpu",
							"exceededMemory",
							"unknown",
						],
					},
					{ method: ["GET", "POST", "PUT"] },
					{ header: { key: "X-HELLO", query: "world" } },
					{ client_ip: ["192.0.2.1", "self"] },
					{ query: "onlyTheseMessagesPlease" },
				],
			};

			await runWrangler(`tail test-worker ${cliFilters}`);
			expect(api.requests.creation[0]).toEqual(expectedWebsocketMessage);
		});
	});

	describe("printing", () => {
		const { setIsTTY } = useMockIsTTY();

		it("logs request messages in JSON format", async () => {
			const api = mockWebsocketAPIs();
			await runWrangler("tail test-worker --format json");

			const event = generateMockRequestEvent();
			const message = generateMockEventMessage({ event });
			const serializedMessage = serialize(message);

			api.ws.send(serializedMessage);
			expect(std.out).toMatch(deserializeToJson(serializedMessage));
		});

		it("logs scheduled messages in JSON format", async () => {
			const api = mockWebsocketAPIs();
			await runWrangler("tail test-worker --format json");

			const event = generateMockScheduledEvent();
			const message = generateMockEventMessage({ event });
			const serializedMessage = serialize(message);

			api.ws.send(serializedMessage);
			expect(std.out).toMatch(deserializeToJson(serializedMessage));
		});

		it("logs alarm messages in json format", async () => {
			const api = mockWebsocketAPIs();
			await runWrangler("tail test-worker --format json");

			const event = generateMockAlarmEvent();
			const message = generateMockEventMessage({ event });
			const serializedMessage = serialize(message);

			api.ws.send(serializedMessage);
			expect(std.out).toMatch(deserializeToJson(serializedMessage));
		});

		it("logs request messages in pretty format", async () => {
			const api = mockWebsocketAPIs();
			await runWrangler("tail test-worker --format pretty");

			const event = generateMockRequestEvent();
			const message = generateMockEventMessage({ event });
			const serializedMessage = serialize(message);

			api.ws.send(serializedMessage);
			expect(
				std.out
					.replace(
						new Date(mockEventTimestamp).toLocaleString(),
						"[mock event timestamp]"
					)
					.replace(mockTailExpiration.toISOString(), "[mock expiration date]")
			).toMatchInlineSnapshot(`
			        "Successfully created tail, expires at [mock expiration date]
			        Connected to test-worker, waiting for logs...
			        GET https://example.org/ - Ok @ [mock event timestamp]"
		      `);
		});

		it("logs scheduled messages in pretty format", async () => {
			const api = mockWebsocketAPIs();
			await runWrangler("tail test-worker --format pretty");

			const event = generateMockScheduledEvent();
			const message = generateMockEventMessage({ event });
			const serializedMessage = serialize(message);

			api.ws.send(serializedMessage);
			expect(
				std.out
					.replace(
						new Date(mockEventTimestamp).toLocaleString(),
						"[mock timestamp string]"
					)
					.replace(mockTailExpiration.toISOString(), "[mock expiration date]")
			).toMatchInlineSnapshot(`
			        "Successfully created tail, expires at [mock expiration date]
			        Connected to test-worker, waiting for logs...
			        \\"* * * * *\\" @ [mock timestamp string] - Ok"
		      `);
		});

		it("logs alarm messages in pretty format", async () => {
			const api = mockWebsocketAPIs();
			await runWrangler("tail test-worker --format pretty");

			const event = generateMockAlarmEvent();
			const message = generateMockEventMessage({ event });
			const serializedMessage = serialize(message);

			api.ws.send(serializedMessage);
			expect(
				std.out
					.replace(
						new Date(mockEventScheduledTime).toLocaleString(),
						"[mock scheduled time]"
					)
					.replace(mockTailExpiration.toISOString(), "[mock expiration date]")
			).toMatchInlineSnapshot(`
			        "Successfully created tail, expires at [mock expiration date]
			        Connected to test-worker, waiting for logs...
			        Alarm @ [mock scheduled time] - Ok"
		      `);
		});

		it("should not crash when the tail message has a void event", async () => {
			const api = mockWebsocketAPIs();
			await runWrangler("tail test-worker --format pretty");

			const message = generateMockEventMessage({ event: null });
			const serializedMessage = serialize(message);

			api.ws.send(serializedMessage);
			expect(
				std.out
					.replace(
						new Date(mockEventTimestamp).toLocaleString(),
						"[mock timestamp string]"
					)
					.replace(mockTailExpiration.toISOString(), "[mock expiration date]")
			).toMatchInlineSnapshot(`
			"Successfully created tail, expires at [mock expiration date]
			Connected to test-worker, waiting for logs...
			Unknown Event - Ok @ [mock timestamp string]"
		`);
		});

		it("defaults to logging in pretty format when the output is a TTY", async () => {
			setIsTTY(true);
			const api = mockWebsocketAPIs();
			await runWrangler("tail test-worker");

			const event = generateMockRequestEvent();
			const message = generateMockEventMessage({ event });
			const serializedMessage = serialize(message);

			api.ws.send(serializedMessage);
			expect(
				std.out
					.replace(
						new Date(mockEventTimestamp).toLocaleString(),
						"[mock event timestamp]"
					)
					.replace(mockTailExpiration.toISOString(), "[mock expiration date]")
			).toMatchInlineSnapshot(`
			        "Successfully created tail, expires at [mock expiration date]
			        Connected to test-worker, waiting for logs...
			        GET https://example.org/ - Ok @ [mock event timestamp]"
		      `);
		});

		it("defaults to logging in json format when the output is not a TTY", async () => {
			setIsTTY(false);

			const api = mockWebsocketAPIs();
			await runWrangler("tail test-worker");

			const event = generateMockRequestEvent();
			const message = generateMockEventMessage({ event });
			const serializedMessage = serialize(message);

			api.ws.send(serializedMessage);
			expect(std.out).toMatch(deserializeToJson(serializedMessage));
		});

		it("logs console messages and exceptions", async () => {
			setIsTTY(true);
			const api = mockWebsocketAPIs();
			await runWrangler("tail test-worker");

			const event = generateMockRequestEvent();
			const message = generateMockEventMessage({
				event,
				logs: [
					{ message: ["some string"], level: "log", timestamp: 1234561 },
					{
						message: [{ complex: "object" }],
						level: "log",
						timestamp: 1234562,
					},
					{ message: [1234], level: "error", timestamp: 1234563 },
				],
				exceptions: [
					{ name: "Error", message: "some error", timestamp: 1234564 },
					{ name: "Error", message: { complex: "error" }, timestamp: 1234564 },
				],
			});
			const serializedMessage = serialize(message);

			api.ws.send(serializedMessage);
			expect(
				std.out
					.replace(
						new Date(mockEventTimestamp).toLocaleString(),
						"[mock event timestamp]"
					)
					.replace(mockTailExpiration.toISOString(), "[mock expiration date]")
			).toMatchInlineSnapshot(`
			        "Successfully created tail, expires at [mock expiration date]
			        Connected to test-worker, waiting for logs...
			        GET https://example.org/ - Ok @ [mock event timestamp]
			          (log) some string
			          (log) { complex: 'object' }
			          (error) 1234"
		      `);
			expect(std.err).toMatchInlineSnapshot(`
			        "[31mX [41;31m[[41;97mERROR[41;31m][0m [1m  Error: some error[0m


			        [31mX [41;31m[[41;97mERROR[41;31m][0m [1m  Error: { complex: 'error' }[0m

			        "
		      `);
			expect(std.warn).toMatchInlineSnapshot(`""`);
		});
	});
});

/* helpers */

/**
 * The built in serialize-to-JSON feature of our mock websocket doesn't work
 * for our use-case since we actually expect a raw buffer,
 * not a Javascript string. Additionally, we have to do some fiddling
 * with `RequestEvent`s to get them to serialize properly.
 *
 * @param message a message to serialize to JSON
 * @returns the same type we expect when deserializing in wrangler
 */
function serialize(message: TailEventMessage): WebSocket.RawData {
	if (!isRequest(message.event)) {
		// `ScheduledEvent`s and `TailEvent`s work just fine
		const stringified = JSON.stringify(message);
		return Buffer.from(stringified, "utf-8");
	} else {
		// Since the "properties" of an `undici.Request` are actually getters,
		// which don't serialize properly, we need to hydrate them manually.
		// This isn't a problem outside of testing since deserialization
		// works just fine and wrangler never _sends_ any event messages,
		// it only receives them.
		const request = ((message.event as RequestEvent | undefined | null) || {})
			.request;
		const stringified = JSON.stringify(message, (key, value) => {
			if (key !== "request") {
				return value;
			}

			return {
				...request,
				url: request?.url,
				headers: request?.headers,
				method: request?.method,
			};
		});

		return Buffer.from(stringified, "utf-8");
	}
}

/**
 * Small helper to disambiguate the event types possible in a `TailEventMessage`
 *
 * @param event A TailEvent
 * @returns true if `event` is a RequestEvent
 */
function isRequest(
	event: ScheduledEvent | RequestEvent | AlarmEvent | undefined | null
): event is RequestEvent {
	return Boolean(event && "request" in event);
}

/**
 * Similarly, we need to deserialize from a raw buffer instead
 * of just JSON.parsing a raw string. This deserializer also then
 * re-stringifies with some spacing, the same way wrangler tail does.
 *
 * @param message a buffer of data received from the websocket
 * @returns a string ready to be printed to the terminal or compared against
 */
function deserializeToJson(message: WebSocket.RawData): string {
	return JSON.stringify(JSON.parse(message.toString()), null, 2);
}

/**
 * A mock for all the different API resources wrangler accesses
 * when running `wrangler tail`
 */
type MockAPI = {
	requests: {
		creation: RequestInit[];
		deletion: RequestCounter;
	};
	ws: MockWebSocket;
	nextMessageJson(): Promise<unknown>;
	closeHelper: () => Promise<void>;
};

/**
 * A counter used to check how many times a mock API has been hit.
 * Useful as a helper in our testing to check if wrangler is making
 * the correct API calls without actually sending any web traffic
 */
type RequestCounter = {
	count: number;
};

/**
 * Mock out the API hit during Tail creation
 *
 * @param websocketURL a fake URL for wrangler to connect a websocket to
 * @returns a `RequestCounter` for counting how many times the API is hit
 */
function mockCreateTailRequest(
	websocketURL: string,
	env?: string,
	legacyEnv = false,
	expectedScriptName = legacyEnv && env ? `test-worker-${env}` : "test-worker"
): RequestInit[] {
	const requests: RequestInit[] = [];
	const servicesOrScripts = env && !legacyEnv ? "services" : "scripts";
	const environment = env && !legacyEnv ? "/environments/:envName" : "";
	msw.use(
		rest.post(
			`*/accounts/:accountId/workers/${servicesOrScripts}/:scriptName${environment}/tails`,
			async (req, res, ctx) => {
				const request = await req.json();
				requests.push(request);
				expect(req.params.accountId).toEqual("some-account-id");
				expect(req.params.scriptName).toEqual(expectedScriptName);
				if (!legacyEnv) {
					expect(req.params.envName).toEqual(env);
				}
				return res(
					ctx.status(200),
					ctx.json({
						success: true,
						errors: [],
						messages: [],
						result: {
							url: websocketURL,
							id: "tail-id",
							expires_at: mockTailExpiration,
						},
					})
				);
			}
		)
	);

	return requests;
}

/**
 * Mock expiration datetime for tails created during testing
 */
const mockTailExpiration = new Date(3005, 1);

/**
 * Default value for event timestamps
 */
const mockEventTimestamp = 1645454470467;

/**
 * Default value for event time ISO strings
 */
const mockEventScheduledTime = new Date(mockEventTimestamp).toISOString();

/**
 * Mock out the API hit during Tail deletion
 *
 * @returns a `RequestCounter` for counting how many times the API is hit
 */
function mockDeleteTailRequest(
	env?: string,
	legacyEnv = false,
	expectedScriptName = legacyEnv && env ? `test-worker-${env}` : "test-worker"
): RequestCounter {
	const requests = { count: 0 };
	const servicesOrScripts = env && !legacyEnv ? "services" : "scripts";
	const environment = env && !legacyEnv ? "/environments/:envName" : "";
	msw.use(
		rest.delete(
			`*/accounts/:accountId/workers/${servicesOrScripts}/:scriptName${environment}/tails/:tailId`,
			async (req, res, ctx) => {
				requests.count++;
				expect(req.params.accountId).toEqual("some-account-id");
				expect(req.params.scriptName).toEqual(expectedScriptName);
				if (!legacyEnv) {
					if (env) {
						expect(req.params.tailId).toEqual("tail-id");
					}
				}
				expect(req.params.tailId).toEqual("tail-id");
				return res(
					ctx.status(200),
					ctx.json({
						success: true,
						errors: [],
						messages: [],
						result: null,
					})
				);
			}
		)
	);

	return requests;
}

const mockWebSockets: MockWebSocket[] = [];

/**
 * All-in-one convenience method to mock the appropriate API calls before
 * each test, and clean up afterwards.
 *
 * @param websocketURL a fake websocket URL for wrangler to connect to
 * @returns a mocked-out version of the API
 */
function mockWebsocketAPIs(
	env?: string,
	legacyEnv = false,
	expectedScriptName?: string
): MockAPI {
	const websocketURL = "ws://localhost:1234";
	const api: MockAPI = {
		requests: {
			deletion: { count: 0 },
			creation: [],
		},
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		ws: null!, // will be set in the `beforeEach()` below.

		/**
		 * Parse the next message received by the mock websocket as JSON
		 * @returns JSON.parse of the next message received by the websocket
		 */
		async nextMessageJson() {
			const message = await api.ws.nextMessage;
			return JSON.parse(message as string);
		},
		/**
		 * Close the mock websocket and clean up the API.
		 * The setTimeout forces a cycle to allow for closing and cleanup
		 * @returns a Promise that resolves when the websocket is closed
		 */
		async closeHelper() {
			api.ws.close();
			await new Promise((resolve) => setTimeout(resolve, 0));
		},
	};
	api.requests.creation = mockCreateTailRequest(
		websocketURL,
		env,
		legacyEnv,
		expectedScriptName
	);
	api.requests.deletion = mockDeleteTailRequest(
		env,
		legacyEnv,
		expectedScriptName
	);
	api.ws = new MockWebSocket(websocketURL);
	mockWebSockets.push(api.ws);

	return api;
}

/**
 * Generate a mock `TailEventMessage` of the same shape sent back by the
 * tail worker.
 *
 * @param opts Any specific parts of the message to use instead of defaults
 * @returns a `TailEventMessage` that wrangler can process and display
 */
function generateMockEventMessage({
	outcome = "ok",
	exceptions = [],
	logs = [],
	eventTimestamp = mockEventTimestamp,
	event = generateMockRequestEvent(),
}: Partial<TailEventMessage>): TailEventMessage {
	return {
		outcome,
		exceptions,
		logs,
		eventTimestamp,
		event,
	};
}

/**
 * Generate a mock `RequestEvent` that, in an alternate timeline, was used
 * to trigger a worker. You can't disprove this!
 *
 * @param opts Any specific parts of the event to use instead of defaults
 * @returns a `RequestEvent` that can be used within an `EventMessage`
 */
function generateMockRequestEvent(
	opts?: Partial<RequestEvent["request"]>
): RequestEvent {
	return {
		request: Object.assign(
			new Request(opts?.url || "https://example.org/", {
				method: opts?.method || "GET",
				headers:
					opts?.headers || new Headers({ "X-EXAMPLE-HEADER": "some_value" }),
			}),
			{
				cf: opts?.cf || {
					tlsCipher: "AEAD-ENCRYPT-O-MATIC-SHA",
					tlsVersion: "TLSv2.0",
					asn: 42069,
					colo: "ATL",
					httpProtocol: "HTTP/4",
					asOrganization: "Cloudflare",
				},
			}
		),
	};
}

function generateMockScheduledEvent(
	opts?: Partial<ScheduledEvent>
): ScheduledEvent {
	return {
		cron: opts?.cron || "* * * * *",
		scheduledTime: opts?.scheduledTime || mockEventTimestamp,
	};
}

function generateMockAlarmEvent(opts?: Partial<AlarmEvent>): AlarmEvent {
	return {
		scheduledTime: opts?.scheduledTime || mockEventScheduledTime,
	};
}
