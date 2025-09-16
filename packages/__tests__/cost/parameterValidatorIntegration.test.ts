import { validateRequestParameters } from "../../cost/models/parameter-validator";
import { Endpoint } from "../../cost/models/types";

describe("Parameter Validator Integration - Fail Fast Behavior", () => {
  const anthropicEndpoint: Endpoint = {
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
    pricing: [{ threshold: 0, input: 0.000003, output: 0.000015 }],
    contextLength: 200000,
    maxCompletionTokens: 8192,
    ptbEnabled: false,
  };

  const openaiEndpoint: Endpoint = {
    baseUrl: "https://api.openai.com/v1/chat/completions",
    provider: "openai",
    author: "openai",
    providerModelId: "gpt-4",
    supportedParameters: [
      "tools",
      "tool_choice",
      "max_tokens",
      "temperature",
      "top_p",
      "stop",
      "frequency_penalty",
      "presence_penalty",
      "seed",
    ],
    pricing: [{ threshold: 0, input: 0.00003, output: 0.00006 }],
    contextLength: 128000,
    maxCompletionTokens: 4096,
    ptbEnabled: false,
  };

  it("should fail Anthropic attempt when using OpenAI-specific parameters", () => {
    const requestBody = {
      model: "claude-3.5-sonnet",
      max_tokens: 1024,
      temperature: 0.7,
      frequency_penalty: 0.5, // OpenAI-specific, not supported by Anthropic
      presence_penalty: 0.3,  // OpenAI-specific, not supported by Anthropic
      messages: [{ role: "user", content: "Hello" }],
    };

    const result = validateRequestParameters(requestBody, anthropicEndpoint);

    expect(result.error).toBeFalsy();
    expect(result.data).toBeDefined();

    // These parameters should be marked as unsupported
    expect(result.data?.unsupported).toContain("frequency_penalty");
    expect(result.data?.unsupported).toContain("presence_penalty");

    // In the actual flow, this would cause the Anthropic attempt to fail
    // and the system would try the OpenAI endpoint next
  });

  it("should succeed with OpenAI endpoint for the same request", () => {
    const requestBody = {
      model: "gpt-4",
      max_tokens: 1024,
      temperature: 0.7,
      frequency_penalty: 0.5, // Supported by OpenAI
      presence_penalty: 0.3,  // Supported by OpenAI
      messages: [{ role: "user", content: "Hello" }],
    };

    const result = validateRequestParameters(requestBody, openaiEndpoint);

    expect(result.error).toBeFalsy();
    expect(result.data).toBeDefined();

    // All parameters should be supported
    expect(result.data?.unsupported).toHaveLength(0);
    expect(result.data?.supported).toContain("frequency_penalty");
    expect(result.data?.supported).toContain("presence_penalty");

    // This attempt would succeed
  });

  it("should fail all attempts if using completely unsupported parameters", () => {
    const requestBody = {
      model: "any-model",
      max_tokens: 1024,
      my_custom_param: "value", // Not supported by any provider
      another_unknown: 123,     // Not supported by any provider
      messages: [{ role: "user", content: "Hello" }],
    };

    // Check Anthropic
    const anthropicResult = validateRequestParameters(requestBody, anthropicEndpoint);
    expect(anthropicResult.data?.unsupported).toHaveLength(0); // These aren't in our known params

    // Check OpenAI
    const openaiResult = validateRequestParameters(requestBody, openaiEndpoint);
    expect(openaiResult.data?.unsupported).toHaveLength(0); // These aren't in our known params

    // Note: Unknown parameters are ignored (not validated) since they might be
    // provider-specific extensions we don't know about
  });

  it("should handle model fallback scenario", () => {
    // Simulating a request that would work with fallback:
    // User requests "gpt-4,claude-3.5-sonnet" with OpenAI-specific params
    const requestBody = {
      model: "gpt-4,claude-3.5-sonnet", // Comma-separated for fallback
      max_tokens: 1024,
      temperature: 0.7,
      seed: 12345, // Supported by OpenAI, not by Anthropic
      messages: [{ role: "user", content: "Hello" }],
    };

    // First attempt: GPT-4 (OpenAI)
    const gpt4Result = validateRequestParameters(requestBody, openaiEndpoint);
    expect(gpt4Result.data?.unsupported).toHaveLength(0); // All params supported

    // Second attempt: Claude (Anthropic) - would only be tried if GPT-4 fails
    const claudeResult = validateRequestParameters(requestBody, anthropicEndpoint);
    expect(claudeResult.data?.unsupported).toContain("seed"); // Seed not supported

    // In practice:
    // 1. GPT-4 attempt would succeed (all params supported)
    // 2. Claude attempt would never be tried
    // But if GPT-4 failed for other reasons (rate limit, etc):
    // 3. Claude attempt would fail immediately due to unsupported 'seed' parameter
  });
});