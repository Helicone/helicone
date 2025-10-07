/**
 * End-to-end test for OpenAI Responses API with Helicone
 * This tests that output_text is properly consolidated and rendered
 */

import { mapOpenAIResponse } from "./packages/llm-mapper/mappers/openai/responses";

// Simulate a streamed response that has been consolidated
const mockConsolidatedResponse = {
  id: "resp-test-123",
  model: "gpt-4",
  item: {
    id: "item-001",
    role: "assistant",
    status: "completed",
    content: [
      {
        type: "output_text",
        text: "The capital of France is Paris. It is located in the north-central part of the country and is known for its art, fashion, gastronomy, and culture.",
      },
    ],
  },
  usage: {
    prompt_tokens: 15,
    completion_tokens: 30,
    total_tokens: 45,
  },
};

const mockRequest = {
  model: "gpt-4",
  input: [
    {
      role: "user" as const,
      content: [
        {
          type: "input_text" as const,
          text: "What is the capital of France?",
        },
      ],
    },
  ],
};

// Test the mapper
console.log("Testing OpenAI Responses API mapper with consolidated output_text...\n");

const result = mapOpenAIResponse({
  request: mockRequest,
  response: mockConsolidatedResponse,
  model: "gpt-4",
});

console.log("=== MAPPED RESULT ===");
console.log(JSON.stringify(result, null, 2));

console.log("\n=== VALIDATION ===");

// Validate that the response message was created correctly
const hasResponseMessages =
  result.schema.response?.messages && result.schema.response.messages.length > 0;
console.log("✓ Has response messages:", hasResponseMessages);

// Validate that the content was extracted from output_text
const responseContent = result.schema.response?.messages?.[0]?.content;
console.log("✓ Response content extracted:", responseContent);
console.log("  Expected: Contains 'capital of France is Paris'");
console.log("  Actual:", responseContent?.includes("capital of France is Paris"));

// Validate that the preview text is correct
const previewResponse = result.preview.response;
console.log("✓ Preview response text:", previewResponse);
console.log("  Expected: Contains 'capital of France is Paris'");
console.log("  Actual:", previewResponse.includes("capital of France is Paris"));

// Validate concatenated messages for rendering
const concatenatedMessages = result.preview.concatenatedMessages;
console.log("✓ Concatenated messages count:", concatenatedMessages.length);
console.log(
  "  Expected: 2 (1 request + 1 response)",
  concatenatedMessages.length === 2
);

// Check the response message structure
const responseMessage = concatenatedMessages.find((m) => m.role === "assistant");
console.log("✓ Response message found:", !!responseMessage);
console.log("✓ Response message _type:", responseMessage?._type);
console.log("✓ Response message content:", responseMessage?.content);

console.log("\n=== TEST RESULT ===");
if (
  hasResponseMessages &&
  responseContent?.includes("capital of France is Paris") &&
  previewResponse.includes("capital of France is Paris") &&
  concatenatedMessages.length === 2 &&
  responseMessage?._type === "message" &&
  responseMessage?.content?.includes("capital of France is Paris")
) {
  console.log("✅ ALL TESTS PASSED! output_text is correctly rendered.");
  process.exit(0);
} else {
  console.log("❌ TESTS FAILED! output_text is not correctly rendered.");
  process.exit(1);
}
