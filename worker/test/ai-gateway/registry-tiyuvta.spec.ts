import { beforeEach, describe, it, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";
import { createOpenAIMockResponse } from "../test-utils";

const authExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

const models = [
  {
    gatewayId: "qwen3.8-27b",
    providerModelId: "qwen/qwen3.8-27b",
  },
  {
    gatewayId: "ornith-1.5-35b-a3b",
    providerModelId: "ornith-ai/ornith-1.5-35b-a3b",
  },
] as const;

describe("Tiyuvta registry tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(models)(
    "routes $gatewayId through Tiyuvta",
    ({ gatewayId, providerModelId }) =>
      runGatewayTest({
        model: `${gatewayId}/tiyuvta`,
        expected: {
          providers: [
            {
              url: "https://api.tiyuvta.ai/v1/chat/completions",
              response: "success",
              model: providerModelId,
              data: createOpenAIMockResponse(providerModelId),
              expects: authExpectations,
            },
          ],
          finalStatus: 200,
        },
      })
  );

  it("auto-selects Tiyuvta for Ornith", () =>
    runGatewayTest({
      model: "ornith-1.5-35b-a3b",
      expected: {
        providers: [
          {
            url: "https://api.tiyuvta.ai/v1/chat/completions",
            response: "success",
            model: "ornith-ai/ornith-1.5-35b-a3b",
            data: createOpenAIMockResponse("ornith-ai/ornith-1.5-35b-a3b"),
            expects: authExpectations,
          },
        ],
        finalStatus: 200,
      },
    }));

  it("preserves Tiyuvta tool, structured-output, and reasoning controls", () =>
    runGatewayTest({
      model: "qwen3.8-27b/tiyuvta",
      request: {
        body: {
          tools: [
            {
              type: "function",
              function: {
                name: "lookup",
                description: "Look up a value",
                parameters: { type: "object", properties: {} },
              },
            },
          ],
          tool_choice: "auto",
          response_format: { type: "json_object" },
          reasoning_effort: "minimal",
        },
      },
      expected: {
        providers: [
          {
            url: "https://api.tiyuvta.ai/v1/chat/completions",
            response: "success",
            model: "qwen/qwen3.8-27b",
            data: createOpenAIMockResponse("qwen/qwen3.8-27b"),
            expects: {
              ...authExpectations,
              bodyContains: [
                "tools",
                "tool_choice",
                "response_format",
                "reasoning_effort",
              ],
            },
          },
        ],
        finalStatus: 200,
      },
    }));

  it("passes through Tiyuvta rate-limit responses", () =>
    runGatewayTest({
      model: "qwen3.8-27b/tiyuvta",
      expected: {
        providers: [
          {
            url: "https://api.tiyuvta.ai/v1/chat/completions",
            response: "failure",
            statusCode: 429,
            errorMessage: "Rate limit exceeded",
          },
        ],
        finalStatus: 429,
      },
    }));
});
