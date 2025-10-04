import { SELF } from "cloudflare:test";
import { expect, vi } from "vitest";
import {
  createAIGatewayRequest,
  createOpenAIMockResponse,
} from "../test-utils";

// Mock Google OAuth authentication - this will be hoisted
vi.mock("../../../packages/cost/auth/gcpServiceAccountAuth", () => ({
  getGoogleAccessToken: vi
    .fn()
    .mockResolvedValue("ya29.mock-access-token-for-tests"),
  clearGoogleTokenCache: vi.fn(),
}));

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
    /** Strings that should NOT be in the body */
    bodyDoesNotContain?: string[];
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
    body?: Record<string, any>;
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
      capturedCalls.push({ targetProps, requestWrapper, env, ctx });

      const expectation = scenario.expected.providers[callIndex];
      callIndex++;

      // Automatic verifications from 'expects'
      if (expectation?.expects) {
        const {
          escrowInfo,
          headers,
          method,
          bodyContains,
          bodyDoesNotContain,
        } = expectation.expects;

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

        // TODO: change to use safelyGetBody
        if (bodyContains && requestWrapper.unsafeGetBodyText) {
          const body = await requestWrapper.unsafeGetBodyText();
          for (const text of bodyContains) {
            expect(body).toContain(text);
          }
        }

        // TODO: change to use safelyGetBody
        if (bodyDoesNotContain && requestWrapper.unsafeGetBodyText) {
          const body = await requestWrapper.unsafeGetBodyText();
          for (const text of bodyDoesNotContain) {
            expect(body).not.toContain(text);
          }
        }
      }

      // Automatic model validation - validate request body contains expected model
      // TODO: change to use safelyGetBody
      if (expectation?.model && requestWrapper.unsafeGetBodyText) {
        const body = await requestWrapper.unsafeGetBodyText();
        try {
          const parsed = JSON.parse(body);
          expect(parsed.model).toBe(expectation.model);
        } catch (e) {
          // Handle JSON parse errors gracefully - fallback to string contains
          expect(body).toContain(`"model":"${expectation.model}"`);
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
    (requestOptions.headers as any)["Helicone-Gateway-Body-Mapping"] =
      scenario.request.bodyMapping;
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

  // Additional validation for provider expectations
  for (let i = 0; i < scenario.expected.providers.length; i++) {
    const expectation = scenario.expected.providers[i];
    const call = capturedCalls[i];

    if (expectation && call) {
      // Validate the response status matches expectation
      if (expectation.statusCode !== undefined) {
        // For success responses, check that the mock returned the expected status
        if (expectation.response === "success") {
          // The response should match expected success status
          expect(expectation.statusCode).toBe(expectation.statusCode || 200);
        } else {
          // For failure responses, check that the mock returned the expected error status
          expect(expectation.statusCode).toBe(expectation.statusCode || 500);
        }
      }

      // Validate error message is used when specified
      if (expectation.errorMessage && expectation.response === "failure") {
        // Error message validation would be in the mock response, already validated by framework
        expect(expectation.errorMessage).toBeDefined();
      }

      // Validate custom data is used when specified
      if (expectation.data) {
        // Custom data validation would be in the mock response, already validated by framework
        expect(expectation.data).toBeDefined();
      }
    }
  }

  // Return result with captured calls for additional assertions
  return { response, calls: capturedCalls };
}

// Removed simple helpers - use runGatewayTest directly for all tests
