import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("helicone-client base URL configuration", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("uses default US API base URL when HELICONE_BASE_URL is not set", async () => {
		delete process.env.HELICONE_BASE_URL;
		const fetchSpy = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ data: [] }),
		});
		vi.stubGlobal("fetch", fetchSpy);

		const { fetchRequests } = await import("../lib/helicone-client.js");
		await fetchRequests("test-key", { filter: {}, limit: 1 });

		expect(fetchSpy).toHaveBeenCalledWith(
			"https://api.helicone.ai/v1/request/query-clickhouse",
			expect.any(Object)
		);
	});

	it("uses custom base URL from HELICONE_BASE_URL env var", async () => {
		process.env.HELICONE_BASE_URL = "https://eu.api.helicone.ai";
		const fetchSpy = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ data: [] }),
		});
		vi.stubGlobal("fetch", fetchSpy);

		const { fetchRequests } = await import("../lib/helicone-client.js");
		await fetchRequests("test-key", { filter: {}, limit: 1 });

		expect(fetchSpy).toHaveBeenCalledWith(
			"https://eu.api.helicone.ai/v1/request/query-clickhouse",
			expect.any(Object)
		);
	});

	it("uses custom gateway URL from HELICONE_AI_GATEWAY_BASE_URL env var", async () => {
		process.env.HELICONE_AI_GATEWAY_BASE_URL = "https://eu.ai-gateway.helicone.ai";
		const fetchSpy = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ id: "test" }),
		});
		vi.stubGlobal("fetch", fetchSpy);

		const { useAiGateway } = await import("../lib/helicone-client.js");
		await useAiGateway("test-key", { model: "gpt-4o", messages: [{ role: "user", content: "hi" }] });

		expect(fetchSpy).toHaveBeenCalledWith(
			"https://eu.ai-gateway.helicone.ai/v1/chat/completions",
			expect.any(Object)
		);
	});

	it("sends the API key in the Authorization header", async () => {
		const fetchSpy = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ data: [] }),
		});
		vi.stubGlobal("fetch", fetchSpy);

		const { fetchRequests } = await import("../lib/helicone-client.js");
		await fetchRequests("sk-helicone-eu-test", { filter: {}, limit: 1 });

		const callArgs = fetchSpy.mock.calls[0][1];
		expect(callArgs.headers.Authorization).toBe("Bearer sk-helicone-eu-test");
	});
});
