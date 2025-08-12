import { SELF } from "cloudflare:test";
import { expect, it, beforeAll, vi } from "vitest";
import { StripeWebhookManager } from "../src/lib/managers/StripeWebhookManager";
import { ok } from "../src/lib/util/results";

// Mock the StripeWebhookManager
vi.mock("../src/lib/managers/StripeWebhookManager");

// currently this test is broken due to the following error:
//
// Module SyntaxError: Unexpected token 'export' seems to be an ES Module but shipped in a CommonJS package. You might want to create an issue to the package "SyntaxError: Unexpected token 'export'" asking them to ship the file in .mjs extension or add "type": "module" in their package.json.
// 
// currently, having issues getting the suggested workaround to actually work.
//
// part of the cause of the problem is a bad package.json from supabase:
// https://publint.dev/@supabase/postgrest-js@1.21.2
it("adds credit balance to wallet on stripe webhook", async () => {
	const event = {
		id: "evt_test_123",
		type: "billing.credit_grant.created",
		data: {
			object: {
				id: "credgr_test_61T4qEpGLo8xCeOP641C97xTvUYCUDbs",
				object: "billing.credit_grant",
				amount: {
					monetary: {
						currency: "usd",
						value: 300,
					},
					type: "monetary",
				},
				applicability_config: {
					scope: {
						price_type: "metered",
					},
				},
				category: "paid",
				created: 1755043863,
				customer: "cus_Sr92PfmMnMUPWk",
				effective_at: 1755043863,
				expires_at: null,
				livemode: false,
				metadata: {
					orgId: "703eee19-0642-40a5-b34e-a126c13c9033",
				},
				name: "",
				priority: 50,
				test_clock: null,
				updated: 1755043863,
				voided_at: null,
			},
		},
		previous_attributes: null,
	};

	// Mock the StripeWebhookManager instance to return the event
	const mockVerifyAndConstructEvent = vi.fn().mockResolvedValue(ok(event));
	vi.mocked(StripeWebhookManager).mockImplementation(() => ({
		verifyAndConstructEvent: mockVerifyAndConstructEvent,
		handleEvent: vi.fn().mockResolvedValue(ok(undefined)),
	} as any));

	const response = await SELF.fetch(
		"https://ai-gateway.helicone.ai/stripe/webhook",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(event),
		}
	);
	expect(await response.text()).toBe("4096");
});