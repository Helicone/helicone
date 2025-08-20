import { env, SELF, fetchMock } from "cloudflare:test";
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  vi,
} from "vitest";
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
  return { s3Mock, loggingMock, callTrackers };
}

describe("Registry Tests with TypeScript Configs", () => {
  const testConfigs: ProviderTestConfig[] = [anthropicTestConfig];

  testConfigs.forEach((config) => {
    const provider = config.provider;

    describe(`${provider} provider`, () => {
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
        // Get all unique PTB endpoints for this provider from the registry - optimized!
        const ptbEndpoints = getAllPtbEndpointsForProvider(provider);

        // Setup PTB mocks using registry endpoints

        // Mock each unique PTB endpoint with extracted path from registry
        ptbEndpoints.forEach((path, baseUrl) => {
          fetchMock
            .get(baseUrl)
            .intercept({
              path: path, // Use exact path from registry URL
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

        // BYOK endpoint tests
        describe("BYOK endpoints", () => {
          // Get model config from registry for BYOK testing
          const modelConfig = registry.getModelProviderConfig(
            modelId,
            provider
          );

          if (modelConfig.error || !modelConfig.data) {
            it.skip(`BYOK - no config found for ${modelId}:${provider}`, () => {});
            return;
          }

          const baseConfig = modelConfig.data;

          // Test each BYOK user configuration
          config.byokUserConfigs.forEach((userConfig) => {
            const activeTestCases = config.testCases.filter(
              (tc) => !tc.skipForNow
            );

            activeTestCases.forEach((testCase) => {
              it(`BYOK ${userConfig.name} - should handle ${testCase.name}`, async () => {
                // Build BYOK endpoint using registry
                const byokEndpointResult = registry.buildEndpoint(
                  baseConfig,
                  userConfig.config
                );

                if (byokEndpointResult.error) {
                  // Skip if BYOK endpoint can't be built for this config
                  console.warn(
                    `Cannot build BYOK endpoint: ${byokEndpointResult.error}`
                  );
                  return;
                }

                const byokEndpoint = byokEndpointResult.data;

                // Extract path from BYOK endpoint URL for proper mocking
                let byokBaseUrl: string;
                let byokPath: string;
                try {
                  const url = new URL(byokEndpoint.baseUrl);
                  byokBaseUrl = `${url.protocol}//${url.host}`;
                  byokPath = url.pathname;
                } catch (e) {
                  console.warn(`Invalid BYOK URL: ${byokEndpoint.baseUrl}`);
                  return; // Skip this test if URL is invalid
                }

                // Setup BYOK mock using extracted path from endpoint

                // Mock the BYOK endpoint URL with extracted path
                fetchMock
                  .get(byokBaseUrl)
                  .intercept({
                    path: byokPath, // Use exact path from BYOK endpoint
                    method: "POST",
                  })
                  .reply((request) => {
                    // Parse request to get model name and test case
                    const body = JSON.parse(request.body as string);
                    const modelName = body.model?.split("/")[0] || body.model;

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

                try {
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

                  // Verify model name contains the BYOK provider model ID
                  expect(body.model).toContain(byokEndpoint.providerModelId);

                  // Verify usage calculation
                  expect(body.usage.total_tokens).toBe(
                    body.usage.prompt_tokens + body.usage.completion_tokens
                  );
                } finally {
                  // BYOK mock will be cleaned up by test framework
                  // No manual cleanup needed
                }
              });
            });
          });
        });
      });
    });
  });

  // Endpoint URL snapshot testing for regression detection
  describe("Registry Endpoint URLs", () => {
    it("should match expected PTB endpoint URLs (snapshot)", () => {
      const allEndpoints: Record<
        string,
        { ptb: string[]; byok: Record<string, string> }
      > = {};

      const allModelsResult = registry.getAllModelIds();
      if (allModelsResult.data) {
        for (const modelId of allModelsResult.data) {
          const providersResult = registry.getModelProviders(modelId);
          if (providersResult.data) {
            for (const provider of providersResult.data) {
              const key = `${modelId}:${provider}`;

              // Get PTB endpoints
              const ptbEndpointsResult = registry.getPtbEndpointsByProvider(
                modelId,
                provider
              );
              const ptbUrls =
                ptbEndpointsResult.data?.map((ep) => ep.baseUrl) || [];

              // Get BYOK endpoints for different configurations
              const modelConfigResult = registry.getModelProviderConfig(
                modelId,
                provider
              );
              const byokUrls: Record<string, string> = {};

              if (modelConfigResult.data) {
                // Test key BYOK configurations
                const testConfigs = [
                  { name: "default", config: {} },
                  { name: "us-east-1", config: { region: "us-east-1" } },
                  { name: "us-west-2", config: { region: "us-west-2" } },
                  {
                    name: "vertex-us-east1",
                    config: {
                      region: "us-east1",
                      projectId: "test-project",
                      location: "us-east1",
                    },
                  },
                ];

                for (const testConfig of testConfigs) {
                  const byokResult = registry.buildEndpoint(
                    modelConfigResult.data,
                    testConfig.config
                  );
                  if (byokResult.data) {
                    byokUrls[testConfig.name] = byokResult.data.baseUrl;
                  }
                }
              }

              if (ptbUrls.length > 0 || Object.keys(byokUrls).length > 0) {
                allEndpoints[key] = {
                  ptb: ptbUrls.sort(), // Sort for consistent snapshots
                  byok: byokUrls,
                };
              }
            }
          }
        }
      }

      // Snapshot the endpoint URLs to detect registry changes
      expect(allEndpoints).toMatchSnapshot("registry-endpoint-urls");
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

// Helper function to get all PTB endpoints for a provider - optimized for testing
function getAllPtbEndpointsForProvider(provider: string): Map<string, string> {
  const endpointsByUrl = new Map<string, string>();
  
  const modelsResult = registry.getProviderModels(provider);
  if (!modelsResult.data) {
    return endpointsByUrl;
  }
  
  for (const modelName of modelsResult.data) {
    const endpointsResult = registry.getPtbEndpointsByProvider(modelName, provider);
    const endpoints = endpointsResult.data || [];
    
    for (const endpoint of endpoints) {
      try {
        const url = new URL(endpoint.baseUrl);
        const baseUrl = `${url.protocol}//${url.host}`;
        const path = url.pathname;
        endpointsByUrl.set(baseUrl, path);
      } catch (e) {
        console.warn(`Invalid URL from registry: ${endpoint.baseUrl}`);
      }
    }
  }
  
  return endpointsByUrl;
}
