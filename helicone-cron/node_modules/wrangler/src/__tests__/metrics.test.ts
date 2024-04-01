import { mkdirSync } from "node:fs";
import fetchMock from "jest-fetch-mock";
import { version as wranglerVersion } from "../../package.json";
import { purgeConfigCaches, saveToConfigCache } from "../config-cache";
import { CI } from "../is-ci";
import { logger } from "../logger";
import { getMetricsDispatcher, getMetricsConfig } from "../metrics";
import {
	CURRENT_METRICS_DATE,
	readMetricsConfig,
	USER_ID_CACHE_PATH,
	writeMetricsConfig,
} from "../metrics/metrics-config";
import { writeAuthConfigFile } from "../user";
import { setMockResponse, unsetAllMocks } from "./helpers/mock-cfetch";
import { mockConsoleMethods } from "./helpers/mock-console";
import { mockConfirm } from "./helpers/mock-dialogs";
import { useMockIsTTY } from "./helpers/mock-istty";
import { runInTempDir } from "./helpers/run-in-tmp";

declare const global: { SPARROW_SOURCE_KEY: string | undefined };

describe("metrics", () => {
	const ORIGINAL_SPARROW_SOURCE_KEY = global.SPARROW_SOURCE_KEY;
	const std = mockConsoleMethods();
	runInTempDir();

	beforeEach(() => {
		// Tell jest to use the original version of the `getMetricsConfig()` function in these tests.
		const mockMetricsConfig = jest.requireMock("../metrics/metrics-config");
		mockMetricsConfig.useOriginal = true;
		global.SPARROW_SOURCE_KEY = "MOCK_KEY";
		logger.loggerLevel = "debug";
		// Create a node_modules directory to store config-cache files
		mkdirSync("node_modules");
	});
	afterEach(() => {
		global.SPARROW_SOURCE_KEY = ORIGINAL_SPARROW_SOURCE_KEY;
		fetchMock.resetMocks();
		unsetAllMocks();
		purgeConfigCaches();
	});

	describe("getMetricsDispatcher()", () => {
		const MOCK_DISPATCHER_OPTIONS = {
			// By setting this to true we avoid the `getMetricsConfig()` logic in these tests.
			sendMetrics: true,
			offline: false,
		};

		// These tests should never hit the `/user` API endpoint.
		const userRequests = mockUserRequest();
		afterEach(() => {
			expect(userRequests.count).toBe(0);
		});

		describe("identify()", () => {
			it("should send a request to the default URL", async () => {
				const dispatcher = await getMetricsDispatcher(MOCK_DISPATCHER_OPTIONS);
				fetchMock.mockResponse("");
				await dispatcher.identify({ a: 1, b: 2 });
				expect(fetchMock).toHaveBeenCalledTimes(1);
				const [url, { body, headers }] = fetchMock.mock.calls[0];
				expect(url).toEqual("https://sparrow.cloudflare.com/api/v1/identify");
				expect(JSON.parse(body)).toEqual(
					expect.objectContaining({
						event: "identify",
						properties: {
							category: "Workers",
							wranglerVersion,
							os: process.platform + ":" + process.arch,
							a: 1,
							b: 2,
						},
					})
				);
				expect(headers).toEqual(
					expect.objectContaining({
						"Sparrow-Source-Key": "MOCK_KEY",
					})
				);
				expect(std.debug).toMatchInlineSnapshot(
					`"Metrics dispatcher: Posting data {\\"type\\":\\"identify\\",\\"name\\":\\"identify\\",\\"properties\\":{\\"a\\":1,\\"b\\":2}}"`
				);
				expect(std.out).toMatchInlineSnapshot(`""`);
				expect(std.warn).toMatchInlineSnapshot(`""`);
				expect(std.err).toMatchInlineSnapshot(`""`);
			});

			it("should write a debug log if the dispatcher is disabled", async () => {
				const dispatcher = await getMetricsDispatcher({
					...MOCK_DISPATCHER_OPTIONS,
					sendMetrics: false,
				});
				await dispatcher.identify({ a: 1, b: 2 });
				expect(fetchMock).toHaveBeenCalledTimes(0);
				expect(std.debug).toMatchInlineSnapshot(
					`"Metrics dispatcher: Dispatching disabled - would have sent {\\"type\\":\\"identify\\",\\"name\\":\\"identify\\",\\"properties\\":{\\"a\\":1,\\"b\\":2}}."`
				);
				expect(std.out).toMatchInlineSnapshot(`""`);
				expect(std.warn).toMatchInlineSnapshot(`""`);
				expect(std.err).toMatchInlineSnapshot(`""`);
			});

			it("should write a debug log if the request fails", async () => {
				const dispatcher = await getMetricsDispatcher(MOCK_DISPATCHER_OPTIONS);
				fetchMock.mockReject(new Error("BAD REQUEST"));
				await dispatcher.identify({ a: 1, b: 2 });
				expect(std.debug).toMatchInlineSnapshot(`
			"Metrics dispatcher: Posting data {\\"type\\":\\"identify\\",\\"name\\":\\"identify\\",\\"properties\\":{\\"a\\":1,\\"b\\":2}}
			Metrics dispatcher: Failed to send request: BAD REQUEST"
		`);
				expect(std.out).toMatchInlineSnapshot(`""`);
				expect(std.warn).toMatchInlineSnapshot(`""`);
				expect(std.err).toMatchInlineSnapshot(`""`);
			});

			it("should write a warning log if no source key has been provided", async () => {
				global.SPARROW_SOURCE_KEY = undefined;
				const dispatcher = await getMetricsDispatcher(MOCK_DISPATCHER_OPTIONS);
				await dispatcher.identify({ a: 1, b: 2 });
				expect(fetchMock).toHaveBeenCalledTimes(0);
				expect(std.debug).toMatchInlineSnapshot(
					`"Metrics dispatcher: Source Key not provided. Be sure to initialize before sending events. { type: 'identify', name: 'identify', properties: { a: 1, b: 2 } }"`
				);
				expect(std.out).toMatchInlineSnapshot(`""`);
				expect(std.warn).toMatchInlineSnapshot(`""`);
				expect(std.err).toMatchInlineSnapshot(`""`);
			});
		});

		describe("sendEvent()", () => {
			it("should send a request to the default URL", async () => {
				const dispatcher = await getMetricsDispatcher(MOCK_DISPATCHER_OPTIONS);
				fetchMock.mockResponse("");
				await dispatcher.sendEvent("some-event", { a: 1, b: 2 });
				expect(fetchMock).toHaveBeenCalledTimes(1);
				const [url, { body, headers }] = fetchMock.mock.calls[0];
				expect(url).toEqual("https://sparrow.cloudflare.com/api/v1/event");
				expect(JSON.parse(body)).toEqual(
					expect.objectContaining({
						event: "some-event",
						properties: {
							category: "Workers",
							wranglerVersion,
							os: process.platform + ":" + process.arch,
							a: 1,
							b: 2,
						},
					})
				);
				expect(headers).toEqual(
					expect.objectContaining({
						"Sparrow-Source-Key": "MOCK_KEY",
					})
				);
				expect(std.debug).toMatchInlineSnapshot(
					`"Metrics dispatcher: Posting data {\\"type\\":\\"event\\",\\"name\\":\\"some-event\\",\\"properties\\":{\\"a\\":1,\\"b\\":2}}"`
				);
				expect(std.out).toMatchInlineSnapshot(`""`);
				expect(std.warn).toMatchInlineSnapshot(`""`);
				expect(std.err).toMatchInlineSnapshot(`""`);
			});

			it("should write a debug log if the dispatcher is disabled", async () => {
				const dispatcher = await getMetricsDispatcher({
					...MOCK_DISPATCHER_OPTIONS,
					sendMetrics: false,
				});
				await dispatcher.sendEvent("some-event", { a: 1, b: 2 });
				expect(fetchMock).toHaveBeenCalledTimes(0);
				expect(std.debug).toMatchInlineSnapshot(
					`"Metrics dispatcher: Dispatching disabled - would have sent {\\"type\\":\\"event\\",\\"name\\":\\"some-event\\",\\"properties\\":{\\"a\\":1,\\"b\\":2}}."`
				);
				expect(std.out).toMatchInlineSnapshot(`""`);
				expect(std.warn).toMatchInlineSnapshot(`""`);
				expect(std.err).toMatchInlineSnapshot(`""`);
			});

			it("should write a debug log if the request fails", async () => {
				const dispatcher = await getMetricsDispatcher(MOCK_DISPATCHER_OPTIONS);
				fetchMock.mockReject(new Error("BAD REQUEST"));
				await dispatcher.sendEvent("some-event", { a: 1, b: 2 });
				expect(std.debug).toMatchInlineSnapshot(`
			"Metrics dispatcher: Posting data {\\"type\\":\\"event\\",\\"name\\":\\"some-event\\",\\"properties\\":{\\"a\\":1,\\"b\\":2}}
			Metrics dispatcher: Failed to send request: BAD REQUEST"
		`);
				expect(std.out).toMatchInlineSnapshot(`""`);
				expect(std.warn).toMatchInlineSnapshot(`""`);
				expect(std.err).toMatchInlineSnapshot(`""`);
			});

			it("should write a warning log if no source key has been provided", async () => {
				global.SPARROW_SOURCE_KEY = undefined;
				const dispatcher = await getMetricsDispatcher(MOCK_DISPATCHER_OPTIONS);
				await dispatcher.sendEvent("some-event", { a: 1, b: 2 });
				expect(fetchMock).toHaveBeenCalledTimes(0);
				expect(std.debug).toMatchInlineSnapshot(
					`"Metrics dispatcher: Source Key not provided. Be sure to initialize before sending events. { type: 'event', name: 'some-event', properties: { a: 1, b: 2 } }"`
				);
				expect(std.out).toMatchInlineSnapshot(`""`);
				expect(std.warn).toMatchInlineSnapshot(`""`);
				expect(std.err).toMatchInlineSnapshot(`""`);
			});
		});
	});

	describe("getMetricsConfig()", () => {
		let isCISpy: jest.SpyInstance;

		const { setIsTTY } = useMockIsTTY();
		beforeEach(() => {
			// Default the mock TTY to interactive for all these tests.
			setIsTTY(true);
			isCISpy = jest.spyOn(CI, "isCI").mockReturnValue(false);
		});

		describe("enabled", () => {
			const ORIGINAL_ENV = process.env;
			beforeEach(() => {
				process.env = { ...ORIGINAL_ENV };
			});
			afterEach(() => {
				process.env = ORIGINAL_ENV;
			});

			it("should return the WRANGLER_SEND_METRICS environment variable for enabled if it is defined", async () => {
				process.env.WRANGLER_SEND_METRICS = "false";
				expect(await getMetricsConfig({})).toMatchObject({
					enabled: false,
				});
				process.env.WRANGLER_SEND_METRICS = "true";
				expect(await getMetricsConfig({})).toMatchObject({
					enabled: true,
				});
			});

			it("should return false if running in a CI environment", async () => {
				isCISpy.mockReturnValue(true);
				expect(await getMetricsConfig({})).toMatchObject({
					enabled: false,
				});
			});

			it("should return the sendMetrics argument for enabled if it is defined", async () => {
				expect(
					await getMetricsConfig({ sendMetrics: false, offline: false })
				).toMatchObject({
					enabled: false,
				});
				expect(
					await getMetricsConfig({ sendMetrics: true, offline: false })
				).toMatchObject({
					enabled: true,
				});
			});

			it("should return enabled false if the process is not interactive", async () => {
				setIsTTY(false);
				expect(
					await getMetricsConfig({
						sendMetrics: undefined,
						offline: false,
					})
				).toMatchObject({
					enabled: false,
				});
			});

			it("should return enabled true if the user on this device previously agreed to send metrics", async () => {
				await writeMetricsConfig({
					permission: {
						enabled: true,
						date: new Date(2022, 6, 4),
					},
				});
				expect(
					await getMetricsConfig({
						sendMetrics: undefined,
						offline: false,
					})
				).toMatchObject({
					enabled: true,
				});
			});

			it("should return enabled false if the user on this device previously refused to send metrics", async () => {
				await writeMetricsConfig({
					permission: {
						enabled: false,
						date: new Date(2022, 6, 4),
					},
				});
				expect(
					await getMetricsConfig({
						sendMetrics: undefined,
						offline: false,
					})
				).toMatchObject({
					enabled: false,
				});
			});

			it("should accept and store permission granting to send metrics if the user agrees", async () => {
				const checkConfirmations = mockConfirm({
					text: "Would you like to help improve Wrangler by sending usage metrics to Cloudflare?",
					result: true,
				});
				expect(
					await getMetricsConfig({
						sendMetrics: undefined,
						offline: false,
					})
				).toMatchObject({
					enabled: true,
				});
				checkConfirmations();
				expect((await readMetricsConfig()).permission).toMatchObject({
					enabled: true,
				});
			});

			it("should accept and store permission declining to send metrics if the user declines", async () => {
				const checkConfirmations = mockConfirm({
					text: "Would you like to help improve Wrangler by sending usage metrics to Cloudflare?",
					result: false,
				});
				expect(
					await getMetricsConfig({
						sendMetrics: undefined,
						offline: false,
					})
				).toMatchObject({
					enabled: false,
				});
				checkConfirmations();
				expect((await readMetricsConfig()).permission).toMatchObject({
					enabled: false,
				});
			});

			it("should ignore the config if the permission date is older than the current metrics date", async () => {
				const checkConfirmations = mockConfirm({
					text: "Would you like to help improve Wrangler by sending usage metrics to Cloudflare?",
					result: false,
				});
				const OLD_DATE = new Date(2000);
				await writeMetricsConfig({
					permission: { enabled: true, date: OLD_DATE },
				});
				expect(
					await getMetricsConfig({
						sendMetrics: undefined,
						offline: false,
					})
				).toMatchObject({
					enabled: false,
				});
				checkConfirmations();
				const { permission } = await readMetricsConfig();
				expect(permission?.enabled).toBe(false);
				// The date should be updated to today's date
				expect(permission?.date).toEqual(CURRENT_METRICS_DATE);

				expect(std.out).toMatchInlineSnapshot(`
			"Usage metrics tracking has changed since you last granted permission.
			Your choice has been saved in the following file: test-xdg-config/metrics.json.

			  You can override the user level setting for a project in \`wrangler.toml\`:

			   - to disable sending metrics for a project: \`send_metrics = false\`
			   - to enable sending metrics for a project: \`send_metrics = true\`"
		`);
			});
		});

		describe("deviceId", () => {
			it("should return a deviceId found in the config file", async () => {
				await writeMetricsConfig({ deviceId: "XXXX-YYYY-ZZZZ" });
				const { deviceId } = await getMetricsConfig({
					sendMetrics: true,
					offline: false,
				});
				expect(deviceId).toEqual("XXXX-YYYY-ZZZZ");
				expect((await readMetricsConfig()).deviceId).toEqual(deviceId);
			});

			it("should create and store a new deviceId if none is found in the config file", async () => {
				await writeMetricsConfig({});
				const { deviceId } = await getMetricsConfig({
					sendMetrics: true,
					offline: false,
				});
				expect(deviceId).toMatch(
					/[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}/
				);
				expect((await readMetricsConfig()).deviceId).toEqual(deviceId);
			});
		});

		describe("userId", () => {
			const userRequests = mockUserRequest();
			it("should return a userId found in a cache file", async () => {
				await saveToConfigCache(USER_ID_CACHE_PATH, {
					userId: "CACHED_USER_ID",
				});
				const { userId } = await getMetricsConfig({
					sendMetrics: true,
					offline: false,
				});
				expect(userId).toEqual("CACHED_USER_ID");
				expect(userRequests.count).toBe(0);
			});

			it("should fetch the userId from Cloudflare and store it in a cache file", async () => {
				writeAuthConfigFile({ oauth_token: "DUMMY_TOKEN" });
				const { userId } = await getMetricsConfig({
					sendMetrics: true,
					offline: false,
				});
				expect(userId).toEqual("MOCK_USER_ID");
				expect(userRequests.count).toBe(1);
			});

			it("should not fetch the userId from Cloudflare if running in `offline` mode", async () => {
				writeAuthConfigFile({ oauth_token: "DUMMY_TOKEN" });
				const { userId } = await getMetricsConfig({
					sendMetrics: true,
					offline: true,
				});
				expect(userId).toBe(undefined);
				expect(userRequests.count).toBe(0);
			});
		});
	});
});

function mockUserRequest() {
	const requests = { count: 0 };
	beforeEach(() => {
		setMockResponse("/user", () => {
			requests.count++;
			return { id: "MOCK_USER_ID" };
		});
	});
	afterEach(() => {
		requests.count = 0;
	});
	return requests;
}
