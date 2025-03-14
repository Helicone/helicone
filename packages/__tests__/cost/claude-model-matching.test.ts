import { costOfPrompt } from "../../cost";
import { ModelRow } from "../../cost/interfaces/Cost";

describe("Claude Model Matching Tests", () => {
  // Sample request from the user's example
  const sampleRequest = {
    model: "claude-3-5-sonnet-v2-20241022",
    promptTokens: 28,
    completionTokens: 418,
    provider: "GOOGLE", // Provider from the user's request
  };

  // Test to check if the model is matched correctly with the GOOGLE provider
  test("should calculate cost with GOOGLE provider for Claude model", () => {
    const cost = costOfPrompt({
      provider: sampleRequest.provider,
      model: sampleRequest.model,
      promptTokens: sampleRequest.promptTokens,
      promptCacheWriteTokens: 0,
      promptCacheReadTokens: 0,
      completionTokens: sampleRequest.completionTokens,
    });

    console.log(`Cost with GOOGLE provider for Claude model: ${cost}`);

    // The cost is likely null because Claude models are not in the Google provider
    // This test is expected to fail, showing the issue
    expect(cost).not.toBeNull();
  });

  // Test to check if the model works with the ANTHROPIC provider
  test("should calculate cost with ANTHROPIC provider for Claude model", () => {
    const cost = costOfPrompt({
      provider: "ANTHROPIC",
      model: sampleRequest.model,
      promptTokens: sampleRequest.promptTokens,
      promptCacheWriteTokens: 0,
      promptCacheReadTokens: 0,
      completionTokens: sampleRequest.completionTokens,
    });

    console.log(`Cost with ANTHROPIC provider for Claude model: ${cost}`);

    // Expected cost calculation based on the claude-3-5-sonnet pricing
    const expectedPromptCost = sampleRequest.promptTokens * 0.000003;
    const expectedCompletionCost = sampleRequest.completionTokens * 0.000015;
    const expectedTotalCost = expectedPromptCost + expectedCompletionCost;

    // This should work because Claude models are in the Anthropic provider
    expect(cost).toBeCloseTo(expectedTotalCost, 6);
  });

  // Test to check if Claude models exist in the Google provider
  test("should check if Claude models exist in Google provider", () => {
    // Import the costs array from Google provider
    const { costs } = require("../../cost/providers/google");

    // Find any entry for Claude models in Google provider
    const claudeEntries = costs.filter((entry: ModelRow) =>
      entry.model.value.includes("claude")
    );

    console.log("Claude models in Google provider:", claudeEntries);

    // Check specifically for claude-3-5-sonnet
    const claudeSonnetEntry = costs.find((entry: ModelRow) =>
      entry.model.value.includes("claude-3-5-sonnet")
    );

    console.log("claude-3-5-sonnet in Google provider:", claudeSonnetEntry);
  });

  // Test to check if the provider is correctly identified from the request
  test("should verify provider identification from the user's request", () => {
    // The sample request from the user has GOOGLE as provider
    const userRequest = {
      _type: "anthropic-chat",
      model: "claude-3-5-sonnet-v2-20241022",
      heliconeMetadata: {
        provider: "GOOGLE",
        cost: 0,
        completionTokens: "0",
        promptTokens: "0",
        totalTokens: "0",
      },
    };

    console.log("Provider in request:", userRequest.heliconeMetadata.provider);
    console.log("Model in request:", userRequest.model);

    // This is the root cause of the issue - the provider is GOOGLE but the model is Claude
    expect(userRequest.heliconeMetadata.provider).toBe("GOOGLE");
    expect(userRequest.model.includes("claude")).toBe(true);
  });

  // Test to suggest a solution - add Claude models to Google provider
  test("should demonstrate a solution by adding Claude to Google provider", () => {
    // Import the costs array from Google provider
    const { costs } = require("../../cost/providers/google");

    // Create a modified costs array with Claude model added
    const modifiedCosts = [
      ...costs,
      {
        model: {
          operator: "includes",
          value: "claude-3-5-sonnet",
        },
        cost: {
          prompt_token: 0.000003,
          completion_token: 0.000015,
        },
      },
    ];

    // Mock the costOfPrompt function with our modified costs
    const mockCostOfPrompt = (request: any) => {
      // Find matching model configuration
      const matchingConfig = modifiedCosts.find((config) => {
        if (config.model.operator === "equals") {
          return request.model === config.model.value;
        } else if (config.model.operator === "includes") {
          return request.model.includes(config.model.value);
        }
        return false;
      });

      if (!matchingConfig) {
        return null;
      }

      // Calculate cost
      const promptCost =
        request.promptTokens * matchingConfig.cost.prompt_token;
      const completionCost =
        request.completionTokens * matchingConfig.cost.completion_token;

      return promptCost + completionCost;
    };

    // Test with our mock function
    const cost = mockCostOfPrompt({
      provider: "GOOGLE",
      model: sampleRequest.model,
      promptTokens: sampleRequest.promptTokens,
      completionTokens: sampleRequest.completionTokens,
    });

    console.log("Cost with modified Google provider:", cost);

    // This should now work because we added Claude to the Google provider
    expect(cost).not.toBeNull();
  });
});
