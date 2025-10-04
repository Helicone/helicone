import { SELF, fetchMock, env, runInDurableObject } from "cloudflare:test";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { registry } from "@helicone-package/cost/models/registry";
import {
  UserEndpointConfig,
  RequestParams,
} from "@helicone-package/cost/models/types";
import { buildEndpointUrl } from "@helicone-package/cost/models/provider-helpers";
import { type TestCase } from "../providers/base.test-config";
import { anthropicTestConfig } from "../providers/anthropic.test-config";
import { setSupabaseTestCase } from "../setup";
import { openaiTestConfig } from "../providers/openai.test-config";
import { groqTestConfig } from "../providers/groq.test-config";

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

  // Build URL dynamically with default request params (non-streaming)
  const requestParams: RequestParams = { isStreaming: false };
  const urlResult = buildEndpointUrl(endpoint, requestParams);
  if (urlResult.error || !urlResult.data) return;

  const url = new URL(urlResult.data);

  if (statusCode === 200) {
    let testConfig;
    if (provider === "anthropic") {
      testConfig = anthropicTestConfig;
    } else {
      testConfig = openaiTestConfig;
    }

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
        ...groqTestConfig.generateSuccessfulPtbTestCases(),
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
            // Build URL dynamically with default request params (non-streaming)
            const requestParams: RequestParams = { isStreaming: false };
            const urlResult = buildEndpointUrl(endpoint, requestParams);
            if (urlResult.error || !urlResult.data) return;

            const url = new URL(urlResult.data);
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
        ...groqTestConfig.generateUnsuccessfulPtbTestCases(),
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
});
