import { SELF } from "cloudflare:test";
import { expect, vi } from "vitest";
import {
  createAIGatewayRequest,
  createOpenAIMockResponse,
} from "../test-utils";

// Mock gatewayRouter - this will be hoisted
vi.mock("../../src/routers/gatewayRouter", () => ({
  gatewayForwarder: vi.fn(),
  getGatewayAPIRouter: vi.fn(),
}));

// Mock errorForwarder to return simple error responses
vi.mock("../../src/lib/HeliconeProxyRequest/ErrorForwarder", () => ({
  errorForwarder: vi
    .fn()
    .mockImplementation(async (request, env, ctx, error) => {
      return new Response(
        JSON.stringify({
          error: error.message || "Test error",
          code: error.code || "test_error",
        }),
        {
          status: error.statusCode || 500,
          headers: { "content-type": "application/json" },
        }
      );
    }),
}));

// We'll define types without importing (will get them from dynamic import)
type TargetProps = any; // We'll fix these types properly
type GatewayRequestWrapper = any;
type GatewayEnv = any;
type GatewayContext = any;

// Captured call for inspection
export type CapturedCall = {
  targetProps: TargetProps;
  requestWrapper: GatewayRequestWrapper;
  env: GatewayEnv;
  ctx: GatewayContext;
};

/**
 * Defines expected behavior for a provider call
 */
export type ProviderExpectation = {
  /** The provider's full URL including path (e.g., "https://api.x.ai/v1/chat/completions") */
  url: string;
  /** Whether this provider should succeed or fail */
  response: "success" | "failure";
  /** HTTP status code (defaults: success=200, failure=500) */
  statusCode?: number;
  /** Model name for the response */
  model?: string;
  /** Error message for failures */
  errorMessage?: string;
  /** Custom response data */
  data?: any;

  /** Declarative expectations */
  expects?: {
    /** Should escrow info be present? */
    escrowInfo?: boolean;
    /** Headers to verify (string for exact match, RegExp for pattern) */
    headers?: Record<string, string | RegExp>;
    /** HTTP method */
    method?: string;
    /** Strings that should be in the body */
    bodyContains?: string[];
  };

  /** Custom verification function for complex cases */
  customVerify?: (call: CapturedCall) => void;
};

/**
 * Complete test scenario configuration
 */
export type GatewayTestScenario = {
  model: string;
  /** Optional request customization */
  request?: {
    messages?: Array<{ role: string; content: string }>;
    maxTokens?: number;
    stream?: boolean;
    headers?: Record<string, string>;
    bodyMapping?: "NO_MAPPING" | "OPENAI";
  };
  expected: {
    /** Ordered list of provider calls expected */
    providers: ProviderExpectation[];
    /** Final response status code */
    finalStatus: number;
    /** Optional: verify response contains text */
    responseContains?: string;
  };
};

export type TestResult = {
  response: Response;
  calls: CapturedCall[];
};

// Removed createScenarioMock - logic moved to gatewayForwarder mock

/**
 * Main test runner - executes a test scenario and validates all expectations
 */
export async function runGatewayTest(
  scenario: GatewayTestScenario
): Promise<TestResult> {
  const capturedCalls: CapturedCall[] = [];
  let callIndex = 0;

  // Dynamic import to get fresh module after vi.resetModules()
  const gatewayRouter = await import("../../src/routers/gatewayRouter");

  vi.mocked(gatewayRouter.gatewayForwarder).mockImplementation(
    async (
      targetProps: TargetProps,
      requestWrapper: GatewayRequestWrapper,
      env: GatewayEnv,
      ctx: GatewayContext
    ) => {
      // Capture the call
      capturedCalls.push({ targetProps, requestWrapper, env, ctx });

      const expectation = scenario.expected.providers[callIndex];
      callIndex++;

      // Automatic verifications from 'expects'
      if (expectation?.expects) {
        const { escrowInfo, headers, method, bodyContains } =
          expectation.expects;

        // Check escrow info
        if (escrowInfo !== undefined) {
          if (escrowInfo) {
            expect(targetProps.escrowInfo).toBeDefined();
            expect(targetProps.escrowInfo).toHaveProperty("escrowId");
          } else {
            expect(targetProps.escrowInfo).toBeUndefined();
          }
        }

        // Check headers
        if (headers && requestWrapper.getHeaders) {
          const requestHeaders = requestWrapper.getHeaders();
          for (const [key, expectedValue] of Object.entries(headers)) {
            const actualValue = requestHeaders.get(key);
            if (expectedValue instanceof RegExp) {
              expect(actualValue).toMatch(expectedValue);
            } else {
              expect(actualValue).toBe(expectedValue);
            }
          }
        }

        // Check method
        if (method && requestWrapper.getMethod) {
          expect(requestWrapper.getMethod()).toBe(method);
        }

        if (bodyContains && requestWrapper.getText) {
          const body = await requestWrapper.getText();
          for (const text of bodyContains) {
            expect(body).toContain(text);
          }
        }
      }
      // Custom verification for complex cases
      if (expectation?.customVerify) {
        expectation.customVerify({ targetProps, requestWrapper, env, ctx });
      }

      // Return mock response based on expectation
      if (!expectation) {
        return new Response("Unexpected call to provider", {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }

      // Verify the URL matches expectation
      if (targetProps.targetBaseUrl !== expectation.url) {
        return new Response(
          JSON.stringify({
            error: `Expected URL ${expectation.url} but got ${targetProps.targetBaseUrl}`,
          }),
          {
            status: 500,
            headers: { "content-type": "application/json" },
          }
        );
      }

      // Return based on expected response type
      if (expectation.response === "success") {
        const responseData =
          expectation.data ||
          createOpenAIMockResponse(expectation.model || "test-model");

        return new Response(JSON.stringify(responseData), {
          status: expectation.statusCode || 200,
          headers: {
            "content-type": "application/json",
            "Helicone-Status": "success",
            "Helicone-Id": crypto.randomUUID(),
          },
        });
      } else {
        return new Response(
          JSON.stringify({
            error: expectation.errorMessage || "Provider failed",
          }),
          {
            status: expectation.statusCode || 500,
            headers: {
              "content-type": "application/json",
              "Helicone-Status": "failed",
              "Helicone-Id": crypto.randomUUID(),
            },
          }
        );
      }
    }
  );

  // Build request with custom headers if provided
  const requestOptions = createAIGatewayRequest(
    scenario.model,
    scenario.request
  );

  // Add custom headers like NO_MAPPING if specified
  if (scenario.request?.bodyMapping) {
    (requestOptions.headers as any)["Helicone-Gateway-Body-Mapping"] = scenario.request.bodyMapping;
  }

  // Add any additional custom headers
  if (scenario.request?.headers) {
    Object.assign(requestOptions.headers, scenario.request.headers);
  }

  const response = await SELF.fetch(
    "https://ai-gateway.helicone.ai/v1/chat/completions",
    requestOptions
  );

  // Assert final status
  expect(response.status).toBe(scenario.expected.finalStatus);

  // Assert number of provider calls
  expect(vi.mocked(gatewayRouter.gatewayForwarder)).toHaveBeenCalledTimes(
    scenario.expected.providers.length
  );

  // Check response content if specified
  if (scenario.expected.responseContains) {
    const responseText = await response.text();
    expect(responseText).toContain(scenario.expected.responseContains);
  }

  // Return result with captured calls for additional assertions
  return { response, calls: capturedCalls };
}

// Removed simple helpers - use runGatewayTest directly for all tests
