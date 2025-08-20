import { SELF, fetchMock } from "cloudflare:test";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { registry } from "@helicone-package/cost/models/registry";
import "./setup";
import {
  anthropicPtbTestCases,
  anthropicByokTestCases,
  generateMockResponse,
  type TestCase,
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
    const ptbTestCases: TestCase[] = [
      ...anthropicPtbTestCases,
    ];
    
    ptbTestCases.forEach((testCase) => {
      it(testCase.name, async () => {
        const endpointsResult = registry.getPtbEndpointsByProvider(testCase.modelId, testCase.provider);
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
                data: generateMockResponse(modelName),
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
              Authorization: "Bearer sk-helicone-aaa1234-bbb1234-ccc1234-ddd1234",
            },
            body: JSON.stringify({
              model: `${testCase.modelId}/${testCase.provider}`,
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

  describe("BYOK Tests", () => {
    const byokTestCases: TestCase[] = [
      ...anthropicByokTestCases,
    ];
    
    byokTestCases.forEach((testCase) => {
      it(testCase.name, async () => {
        const modelConfig = registry.getModelProviderConfig(testCase.modelId, testCase.provider);
        if (!modelConfig.data) {
          console.warn(`No config found for ${testCase.modelId}:${testCase.provider}`);
          return;
        }
        
        const byokEndpointResult = registry.buildEndpoint(modelConfig.data, testCase.byokConfig || {});
        if (!byokEndpointResult.data) {
          console.warn(`Cannot build BYOK endpoint for ${testCase.name}`);
          return;
        }
        
        const byokEndpoint = byokEndpointResult.data;
        const url = new URL(byokEndpoint.baseUrl);
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
              data: generateMockResponse(modelName),
              responseOptions: {
                headers: { "content-type": "application/json" },
              },
            };
          })
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-aaa1234-bbb1234-ccc1234-ddd1234",
            },
            body: JSON.stringify({
              model: `${testCase.modelId}/${testCase.provider}`,
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
