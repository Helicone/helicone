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

import "./setup";
import {
  anthropicTestConfig,
  type ProviderTestConfig,
} from "./providers/anthropic.test-config";

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

describe("Registry Tests with Provider Configs", () => {
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
        serviceMocks = mockRequiredServices();
      });

      afterAll(() => {
        fetchMock.deactivate();
      });

      providerModels.forEach((modelId) => {
        describe(modelId, () => {
          const modelConfig = registry.getModelProviderConfig(
            modelId,
            provider
          );
          const providerModelId = modelConfig.data?.providerModelId || modelId;

          const activeTestCases = config.testCases.filter(
            (tc) => !tc.skipForNow
          );

          activeTestCases.forEach((testCase) => {
            it(`should handle ${testCase.name}`, async () => {
              const ptbEndpoints = getAllPtbEndpointsForProvider(provider);
              
              ptbEndpoints.forEach((path, baseUrl) => {
                fetchMock
                  .get(baseUrl)
                  .intercept({
                    path: path,
                    method: "POST",
                  })
                  .reply((request) => {
                    const body = JSON.parse(request.body as string);
                    const modelName = body.model?.split("/")[0] || body.model;
                    
                    const mockResponse = config.generateMockResponse(modelName);

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

              expect(body.model).toContain(providerModelId);

              expect(body.usage.total_tokens).toBe(
                body.usage.prompt_tokens + body.usage.completion_tokens
              );
            });
          });
        });

        describe("BYOK endpoints", () => {
          const modelConfig = registry.getModelProviderConfig(
            modelId,
            provider
          );

          if (modelConfig.error || !modelConfig.data) {
            it.skip(`BYOK - no config found for ${modelId}:${provider}`, () => {});
            return;
          }

          const baseConfig = modelConfig.data;

          config.byokUserConfigs.forEach((userConfig) => {
            const activeTestCases = config.testCases.filter(
              (tc) => !tc.skipForNow
            );

            activeTestCases.forEach((testCase) => {
              it(`BYOK ${userConfig.name} - should handle ${testCase.name}`, async () => {
                const byokEndpointResult = registry.buildEndpoint(
                  baseConfig,
                  userConfig.config
                );

                if (byokEndpointResult.error) {
                  console.warn(
                    `Cannot build BYOK endpoint: ${byokEndpointResult.error}`
                  );
                  return;
                }

                const byokEndpoint = byokEndpointResult.data;
                if (!byokEndpoint) {
                  console.warn(
                    `No BYOK endpoint returned for ${userConfig.name}`
                  );
                  return;
                }

                let byokBaseUrl: string;
                let byokPath: string;
                try {
                  const url = new URL(byokEndpoint.baseUrl);
                  byokBaseUrl = `${url.protocol}//${url.host}`;
                  byokPath = url.pathname;
                } catch (e) {
                  console.warn(`Invalid BYOK URL: ${byokEndpoint.baseUrl}`);
                  return;
                }

                fetchMock
                  .get(byokBaseUrl)
                  .intercept({
                    path: byokPath,
                    method: "POST",
                  })
                  .reply((request) => {
                    const body = JSON.parse(request.body as string);
                    const modelName = body.model?.split("/")[0] || body.model;

                    const mockResponse = config.generateMockResponse(modelName);

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

                  expect(body.model).toContain(byokEndpoint.providerModelId);

                  expect(body.usage.total_tokens).toBe(
                    body.usage.prompt_tokens + body.usage.completion_tokens
                  );
                } finally {
                }
              });
            });
          });
        });
      });
    });
  });

  describe("Registry Endpoint URLs", () => {
    it("should match expected PTB endpoint URLs (snapshot)", () => {
      const allEndpoints: Record<
        string,
        { ptb: Record<string, string>; byok: Record<string, string> }
      > = {};

      const allModelsResult = registry.getAllModelIds();
      if (allModelsResult.data) {
        for (const modelId of allModelsResult.data) {
          const providersResult = registry.getModelProviders(modelId);
          if (providersResult.data) {
            for (const provider of providersResult.data) {
              const key = `${modelId}:${provider}`;

              const ptbEndpointsResult = registry.getPtbEndpointsWithIds(
                modelId,
                provider
              );
              const ptbEndpoints = ptbEndpointsResult.data || {};

              const modelConfigResult = registry.getModelProviderConfig(
                modelId,
                provider
              );
              const byokUrls: Record<string, string> = {};

              if (modelConfigResult.data) {
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

              if (
                Object.keys(ptbEndpoints).length > 0 ||
                Object.keys(byokUrls).length > 0
              ) {
                allEndpoints[key] = {
                  ptb: ptbEndpoints, // Now includes deployment IDs!
                  byok: byokUrls,
                };
              }
            }
          }
        }
      }

      expect(allEndpoints).toMatchSnapshot("registry-endpoint-urls");
    });
  });

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

      expect(missingProviders.length).toBeGreaterThan(0);
    });
  });
});

function getAllPtbEndpointsForProvider(provider: string): Map<string, string> {
  const endpointsByUrl = new Map<string, string>();

  const modelsResult = registry.getProviderModels(provider);
  if (!modelsResult.data) {
    return endpointsByUrl;
  }

  for (const modelName of modelsResult.data) {
    const endpointsResult = registry.getPtbEndpointsByProvider(
      modelName,
      provider
    );
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
