import { validateRequestParameters } from "../../cost/models/parameter-validator";
import { Endpoint } from "../../cost/models/types";

describe("Parameter Validator", () => {
  const mockEndpoint: Endpoint = {
    baseUrl: "https://api.anthropic.com/v1/messages",
    provider: "anthropic",
    author: "anthropic",
    providerModelId: "claude-3-5-sonnet-20241022",
    supportedParameters: [
      "tools",
      "tool_choice",
      "max_tokens",
      "temperature",
      "top_p",
      "top_k",
      "stop",
    ],
    pricing: [
      {
        threshold: 0,
        input: 0.000003,
        output: 0.000015,
      },
    ],
    contextLength: 200000,
    maxCompletionTokens: 8192,
    ptbEnabled: false,
  };

  it("should validate supported parameters correctly", () => {
    const requestBody = {
      model: "claude-3.5-sonnet",
      max_tokens: 1024,
      temperature: 0.7,
      top_p: 0.9,
      messages: [{ role: "user", content: "Hello" }],
    };

    const result = validateRequestParameters(requestBody, mockEndpoint);

    expect(result.error).toBeFalsy();
    expect(result.data).toBeDefined();
    expect(result.data?.supported).toContain("max_tokens");
    expect(result.data?.supported).toContain("temperature");
    expect(result.data?.supported).toContain("top_p");
    expect(result.data?.unsupported).toHaveLength(0);
    expect(result.data?.warnings).toHaveLength(0);
  });

  it("should detect unsupported parameters", () => {
    const requestBody = {
      model: "claude-3.5-sonnet",
      max_tokens: 1024,
      temperature: 0.7,
      frequency_penalty: 0.5, // Not supported by Anthropic
      presence_penalty: 0.3, // Not supported by Anthropic
      messages: [{ role: "user", content: "Hello" }],
    };

    const result = validateRequestParameters(requestBody, mockEndpoint);

    expect(result.error).toBeFalsy();
    expect(result.data).toBeDefined();
    expect(result.data?.supported).toContain("max_tokens");
    expect(result.data?.supported).toContain("temperature");
    expect(result.data?.unsupported).toContain("frequency_penalty");
    expect(result.data?.unsupported).toContain("presence_penalty");
    expect(result.data?.warnings).toHaveLength(2);
    expect(result.data?.warnings[0]).toContain("frequency_penalty");
    expect(result.data?.warnings[1]).toContain("presence_penalty");
  });

  it("should handle legacy function parameters", () => {
    const requestBody = {
      model: "claude-3.5-sonnet",
      max_tokens: 1024,
      functions: [
        {
          name: "test_function",
          description: "A test function",
        },
      ],
      messages: [{ role: "user", content: "Hello" }],
    };

    const result = validateRequestParameters(requestBody, mockEndpoint);

    expect(result.error).toBeFalsy();
    expect(result.data).toBeDefined();
    expect(result.data?.warnings).toContain(
      "Legacy parameter 'functions' detected. Consider migrating to the 'tools' format."
    );
  });

  it("should handle legacy function_call on model without tools support", () => {
    const endpointWithoutTools: Endpoint = {
      ...mockEndpoint,
      supportedParameters: ["max_tokens", "temperature", "top_p"],
    };

    const requestBody = {
      model: "some-model",
      max_tokens: 1024,
      function_call: "auto",
      messages: [{ role: "user", content: "Hello" }],
    };

    const result = validateRequestParameters(requestBody, endpointWithoutTools);

    expect(result.error).toBeFalsy();
    expect(result.data).toBeDefined();
    expect(result.data?.unsupported).toContain("function_call");
    expect(result.data?.warnings).toContainEqual(
      expect.stringContaining("Legacy parameter 'function_call' is not supported")
    );
  });

  it("should handle response_format parameters", () => {
    const requestBody = {
      model: "gpt-4",
      max_tokens: 1024,
      response_format: {
        type: "json_object",
      },
      messages: [{ role: "user", content: "Hello" }],
    };

    const openAIEndpoint: Endpoint = {
      ...mockEndpoint,
      provider: "openai",
      supportedParameters: ["max_tokens", "response_format", "json_mode"],
    };

    const result = validateRequestParameters(requestBody, openAIEndpoint);

    expect(result.error).toBeFalsy();
    expect(result.data).toBeDefined();
    expect(result.data?.supported).toContain("response_format");
    expect(result.data?.supported).toContain("json_mode");
    expect(result.data?.unsupported).toHaveLength(0);
  });
});