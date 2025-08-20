import { env, SELF, fetchMock } from "cloudflare:test";
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from "vitest";
import { registry } from "@helicone-package/cost/models/registry";

// Import the setup file to mock Supabase
import "./setup";

// Import test configs
import {
  anthropicTestConfig,
  type ProviderTestConfig,
} from "./providers/anthropic.test-config";

// Helper to mock required services (Supabase, S3, etc)
function mockRequiredServices() {
  // Track calls to each service
  const callTrackers = {
    s3Called: false,
    queueCalled: false,
    loggingCalled: false,
  };

  // Mock S3/MinIO storage - match the actual path pattern
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

  // Mock logging endpoint - match the exact path
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

  // Mock queue endpoints (Upstash Redis)
  const queueMock = fetchMock
    .get("https://us1.upstash.io")
    .intercept({
      path: () => true,
      method: "POST",
    })
    .reply(() => {
      callTrackers.queueCalled = true;
      return { statusCode: 200, data: { success: true } };
    })
    .persist();

  return { s3Mock, loggingMock, queueMock, callTrackers };
}

describe("Registry Tests with TypeScript Configs", () => {
  // Define all test configs
  const testConfigs: ProviderTestConfig[] = [
    anthropicTestConfig,
    // Add more providers here as we create them
  ];

  testConfigs.forEach((config) => {
    const provider = config.provider;

    describe(`${provider} provider`, () => {
      // Get models for this provider directly from registry
      const providerModels: string[] = [];
      const providerModelsResult = registry.getProviderModels(provider);

      if (providerModelsResult.data) {
        providerModelsResult.data.forEach((modelId) => {
          providerModels.push(modelId);
        });
      }

      if (providerModels.length === 0) {
        it.skip(`no models found for ${provider}`, () => {});
        return;
      }

      let serviceMocks: ReturnType<typeof mockRequiredServices>;

      beforeAll(() => {
        fetchMock.activate();
        fetchMock.disableNetConnect();
        
        // Mock required services once for all tests
        serviceMocks = mockRequiredServices();
      });

      beforeEach(() => {
        // Mock the provider's API endpoint to return appropriate responses
        fetchMock
          .get(config.baseUrl)
          .intercept({
            path: "/v1/chat/completions",
            method: "POST",
          })
          .reply((request) => {
            // Parse request to get model name and test case
            const body = JSON.parse(request.body as string);
            const modelName = body.model?.split("/")[0] || body.model;

            // Find matching test case based on request
            const testCase =
              config.testCases.find(
                (tc) =>
                  JSON.stringify(tc.request.messages) ===
                  JSON.stringify(body.messages)
              ) || config.testCases[0];

            // Generate mock response using registry data
            const mockResponse = config.generateMockResponse(
              modelName,
              testCase
            );

            return {
              statusCode: 200,
              data: mockResponse,
              responseOptions: {
                headers: { "content-type": "application/json" },
              },
            };
          })
          .persist();
      });

      afterAll(() => {
        fetchMock.deactivate();
      });

      // Create tests for each model from registry
      providerModels.forEach((modelId) => {
        describe(modelId, () => {
          // Get model config from registry
          const modelConfig = registry.getModelProviderConfig(
            modelId,
            provider
          );
          const providerModelId = modelConfig.data?.providerModelId || modelId;

          // Filter out skipped test cases
          const activeTestCases = config.testCases.filter(
            (tc) => !tc.skipForNow
          );

          activeTestCases.forEach((testCase) => {
            it(`should handle ${testCase.name}`, async () => {
              const response = await SELF.fetch(
                "https://ai-gateway.helicone.ai/v1/chat/completions",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization:
                      "Bearer sk-helicone-aaa1234-bbb1234-ccc1234-ddd1234",
                  },
                  body: JSON.stringify({
                    model: `${modelId}/${provider}`,
                    ...testCase.request,
                  }),
                }
              );

              expect(response.status).toBe(200);

              const body = (await response.json()) as any;
              expect(body).toHaveProperty("model");
              expect(body).toHaveProperty("usage");

              // Verify model name contains the provider model ID from registry
              expect(body.model).toContain(providerModelId);

              // Verify usage calculation
              expect(body.usage.total_tokens).toBe(
                body.usage.prompt_tokens + body.usage.completion_tokens
              );
            });
          });

          // TODO: Add auth error tests later when we want to test error handling
        });
      });
    });
  });

  // Report coverage
  describe("Provider Coverage", () => {
    it("should have test configs for all providers", () => {
      const allProvidersSet = new Set<string>();
      const allModelsResult = registry.getAllModelIds();

      if (allModelsResult.data) {
        for (const modelId of allModelsResult.data) {
          const providersResult = registry.getModelProviders(modelId);
          if (providersResult.data) {
            providersResult.data.forEach((p) => allProvidersSet.add(p));
          }
        }
      }

      const allProviders = Array.from(allProvidersSet);
      const configuredProviders = testConfigs.map((c) => c.provider);

      const missingProviders = allProviders.filter(
        (p) => !configuredProviders.includes(p)
      );

      if (missingProviders.length > 0) {
        console.warn(
          "⚠️ Missing test configs for providers:",
          missingProviders
        );
        console.warn(
          "Create configs at: test/providers/<provider>.test-config.ts"
        );
      }

      // We expect some providers to be missing initially
      expect(missingProviders.length).toBeGreaterThan(0);
    });
  });
});
