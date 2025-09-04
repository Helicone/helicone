import { SELF, fetchMock, env, runInDurableObject } from "cloudflare:test";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { registry } from "@helicone-package/cost/models/registry";
import { UserEndpointConfig } from "@helicone-package/cost/models/types";
import { type TestCase } from "../providers/base.test-config";
import { anthropicTestConfig } from "../providers/anthropic.test-config";
import { setSupabaseTestCase } from "../setup";
import { openaiTestConfig } from "../providers/openai.test-config";

const TEST_HELICONE_API_KEY = "sk-helicone-aaa1234-bbb1234-ccc1234-ddd1234";

function mockRequiredServices() {
  const callTrackers = {
    s3Called: false,
    loggingCalled: false,
  };

  const s3Mock = fetchMock
    .get("http://localhost:9000")
    .intercept({
      path: /.*/,
      method: "PUT",
    })
    .reply(() => {
      callTrackers.s3Called = true;
      return { statusCode: 200, data: "" };
    })
    .persist();

  const loggingMock = fetchMock
    .get("http://localhost:8585")
    .intercept({
      path: "/v1/log/request",
      method: "POST",
    })
    .reply(() => {
      callTrackers.loggingCalled = true;
      return { statusCode: 200, data: { success: true } };
    })
    .persist();
  return { s3Mock, loggingMock, callTrackers };
}

function mockProviderEndpoint(
  modelId: string,
  provider: string,
  statusCode: number,
  byokConfig: UserEndpointConfig = {}
) {
  const config = registry.getModelProviderConfig(modelId, provider).data;
  if (!config) return;

  const endpoint = registry.buildEndpoint(config, byokConfig).data;
  if (!endpoint) return;

  const url = new URL(endpoint.baseUrl);

  if (statusCode === 200) {
    // For now just use anthropic config, in future we'll have a map of providers
    const testConfig = anthropicTestConfig;

    fetchMock
      .get(`${url.protocol}//${url.host}`)
      .intercept({ path: url.pathname, method: "POST" })
      .reply((request) => {
        const body = JSON.parse(request.body as string);
        const modelName = body.model?.split("/")[0] || body.model;
        return {
          statusCode: 200,
          data: testConfig.generateMockResponse(modelName),
          responseOptions: { headers: { "content-type": "application/json" } },
        };
      })
      .persist();
  } else {
    fetchMock
      .get(`${url.protocol}//${url.host}`)
      .intercept({ path: url.pathname, method: "POST" })
      .reply(() => ({ statusCode, data: { error: "Provider failed" } }))
      .persist();
  }
}

async function seedDurableObject(testCase: TestCase) {
  if (!testCase.orgId) {
    return;
  }
  const walletId = env.WALLET.idFromName(testCase.orgId);
  const walletStub = env.WALLET.get(walletId);
  if (testCase.currentCredits !== undefined && testCase.currentCredits > 0) {
    await runInDurableObject(walletStub, async (walletStub) => {
      await walletStub.setCredits(
        testCase.currentCredits ?? 0,
        `test-credits-${Date.now()}`
      );
    });
  }
}

async function setupTestMocks(testCase: TestCase) {
  const byokConfig = testCase.byokConfig || {};

  if (testCase.testType === "multi-provider-fallback") {
    // Mock failures for specified providers (with same byokConfig)
    testCase.failProviders?.forEach((failProvider) => {
      mockProviderEndpoint(testCase.modelId, failProvider, 500, byokConfig);
    });
  }

  // Mock success for the target provider
  if (testCase.provider) {
    mockProviderEndpoint(testCase.modelId, testCase.provider, 200, byokConfig);
  }

  // Mock the /v1/credits/totalSpend endpoint
  fetchMock
    .get("http://localhost:8585")
    .intercept({
      path: "/v1/credits/totalSpend",
      method: "GET",
    })
    .reply(() => ({
      statusCode: 200,
      data: { data: { totalSpend: 0 }, error: null },
    }))
    .persist();

  // Add credits if specified in test case
  seedDurableObject(testCase);

  setSupabaseTestCase(testCase);
}

describe("Registry Tests", () => {
  beforeAll(() => {
    fetchMock.activate();
    fetchMock.disableNetConnect();
    mockRequiredServices();
  });

  afterAll(() => {
    fetchMock.deactivate();
  });

  describe("PTB Tests", () => {
    describe("with sufficient credits", () => {
      const ptbTestCases: TestCase[] = [
        // TODO add back anthropic
        // ...anthropicTestConfig.generateSuccessfulPtbTestCases(),
        ...openaiTestConfig.generateSuccessfulPtbTestCases(),
      ];

      ptbTestCases.forEach((testCase) => {
        it(testCase.name, async () => {
          await setupTestMocks(testCase);
          if (!testCase.provider) {
            console.warn(`No provider specified for ${testCase.name}`);
            return;
          }
          const endpointsResult = registry.getPtbEndpointsByProvider(
            testCase.modelId,
            testCase.provider
          );
          const endpoints = endpointsResult.data || [];

          endpoints.forEach((endpoint) => {
            const url = new URL(endpoint.baseUrl);
            const baseUrl = `${url.protocol}//${url.host}`;
            const path = url.pathname;

            fetchMock
              .get(baseUrl)
              .intercept({
                path: path,
                method: "POST",
              })
              .reply((request) => {
                const body = JSON.parse(request.body as string);
                const modelName = body.model?.split("/")[0] || body.model;
                return {
                  statusCode: 200,
                  data: anthropicTestConfig.generateMockResponse(modelName),
                  responseOptions: {
                    headers: { "content-type": "application/json" },
                  },
                };
              })
              .persist();
          });

          const response = await SELF.fetch(
            "https://ai-gateway.helicone.ai/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${TEST_HELICONE_API_KEY}`,
              },
              body: JSON.stringify({
                model: `${testCase.modelId}/${testCase.provider}`,
                ...testCase.request,
              }),
            }
          );

          const body = (await response.json()) as any;
          expect(response.status).toBe(200);
          expect(body).toHaveProperty("model");
          expect(body).toHaveProperty("usage");
          expect(body.usage.total_tokens).toBe(
            body.usage.prompt_tokens + body.usage.completion_tokens
          );

          const orgId = testCase.orgId ?? "test-org-id";
          const walletId = env.WALLET.idFromName(orgId);
          const walletStub = env.WALLET.get(walletId);
          await runInDurableObject(walletStub, async (walletStub) => {
            const walletState = await walletStub.getWalletState(orgId);
            expect(walletState.effectiveBalance).toBeLessThan(
              walletState.balance
            );
            expect(walletState.effectiveBalance).toBeLessThan(
              walletState.totalCredits
            );
            expect(walletState.totalEscrow).toBeGreaterThan(0);
          });
        });
      });
    });

    describe("with insufficient credits", () => {
      const ptbTestCases: TestCase[] = [
        // TODO add back anthropic
        // ...anthropicTestConfig.generateUnsuccessfulPtbTestCases(),
        ...openaiTestConfig.generateUnsuccessfulPtbTestCases(),
      ];

      ptbTestCases.forEach((testCase) => {
        it(testCase.name, async () => {
          await setupTestMocks(testCase);
          if (!testCase.provider) {
            console.warn(`No provider specified for ${testCase.name}`);
            return;
          }
          const response = await SELF.fetch(
            "https://ai-gateway.helicone.ai/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${TEST_HELICONE_API_KEY}`,
              },
              body: JSON.stringify({
                model: `${testCase.modelId}/${testCase.provider}`,
                ...testCase.request,
              }),
            }
          );

          expect(response.status).toBe(429);
          const body = (await response.json()) as any;
          expect(body).toHaveProperty("error");
          expect(body.success).toBe(false);
        });
      });
    });
  });

  describe("BYOK Tests", () => {
    const byokTestCases: TestCase[] = [
      ...anthropicTestConfig.generateByokTestCases(),
      // Future: ...bedrockTestConfig.generateByokTestCases(),
    ];

    byokTestCases.forEach((testCase) => {
      it(testCase.name, async () => {
        await setupTestMocks(testCase);

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${TEST_HELICONE_API_KEY}`,
            },
            body: JSON.stringify({
              model: testCase.modelString,
              ...testCase.request,
            }),
          }
        );

        expect(response.status).toBe(200);
        const body = (await response.json()) as any;
        expect(body).toHaveProperty("model");
        expect(body).toHaveProperty("usage");
        expect(body.usage.total_tokens).toBe(
          body.usage.prompt_tokens + body.usage.completion_tokens
        );
      });
    });
  });

  describe("Customer-Specific Tests", () => {
    describe("Anthropic SDK with NO_MAPPING", () => {
      it("should route to /v1/messages for Anthropic provider", async () => {
        // Mock Anthropic /v1/messages endpoint (NOT /chat/completions)
        fetchMock
          .get("https://api.anthropic.com")
          .intercept({
            path: "/v1/messages",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              id: "msg_test",
              type: "message",
              role: "assistant",
              content: [{ type: "text", text: "Test response" }],
              model: "claude-3-7-sonnet-20250219",
              usage: { input_tokens: 10, output_tokens: 5 },
            },
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${TEST_HELICONE_API_KEY}`,
              "Helicone-Gateway-Body-Mapping": "NO_MAPPING",
            },
            body: JSON.stringify({
              model: "claude-3-7-sonnet-20250219/anthropic",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    describe("Fallback with comma-separated models", () => {
      it("should try bedrock first, then fallback to anthropic", async () => {
        // Mock Bedrock to fail
        fetchMock
          .get("https://bedrock-runtime.us-east-1.amazonaws.com")
          .intercept({
            path: "/model/us.anthropic.claude-3-7-sonnet-20250219-v1:0/invoke",
            method: "POST",
          })
          .reply(() => ({ statusCode: 500, data: { error: "Bedrock failed" } }))
          .persist();

        // Mock Anthropic to succeed (on /v1/messages)
        fetchMock
          .get("https://api.anthropic.com")
          .intercept({
            path: "/v1/messages",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              id: "msg_fallback",
              type: "message",
              role: "assistant",
              content: [{ type: "text", text: "Fallback response" }],
              model: "claude-3-7-sonnet-20250219",
              usage: { input_tokens: 10, output_tokens: 5 },
            },
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${TEST_HELICONE_API_KEY}`,
            },
            body: JSON.stringify({
              model:
                "us.anthropic.claude-3-7-sonnet-20250219-v1:0/bedrock,claude-3-7-sonnet-20250219/anthropic",
              messages: [{ role: "user", content: "Test fallback" }],
              max_tokens: 50,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    describe("Model with NO_MAPPING and fallback", () => {
      it("should handle Anthropic SDK format with fallback", async () => {
        const model =
          "claude-3-7-sonnet-20250219/anthropic, us.anthropic.claude-3-7-sonnet-20250219-v1:0/bedrock";

        // Mock first model (anthropic) to succeed on /v1/messages
        fetchMock
          .get("https://api.anthropic.com")
          .intercept({
            path: "/v1/messages",
            method: "POST",
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              id: "msg_anthropic_sdk",
              type: "message",
              role: "assistant",
              content: [{ type: "text", text: "Anthropic SDK response" }],
              model: "claude-3-7-sonnet-20250219",
              usage: { input_tokens: 10, output_tokens: 5 },
            },
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
              "Helicone-Gateway-Body-Mapping": "NO_MAPPING",
            },
            body: JSON.stringify({
              model: model,
              system: "You are a helpful assistant.",
              messages: [
                { role: "user", content: "What is the capital of France?" },
              ],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });
  });
});
