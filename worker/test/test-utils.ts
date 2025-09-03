/**
 * Shared test utilities for all test files
 */

import { fetchMock } from "cloudflare:test";
import {
  TEST_ENDPOINTS,
  TEST_HEADERS,
  TEST_USER_MESSAGE,
  TEST_MAX_TOKENS,
} from "./test-constants";

// Re-export the mockRequiredServices from mock-stack
export { mockRequiredServices } from "./mock-stack.spec";

/**
 * Create a test request for the AI gateway
 */
export function createTestRequest(
  model: string,
  options?: {
    messages?: Array<{ role: string; content: string }>;
    maxTokens?: number;
    headers?: Record<string, string>;
  }
) {
  return {
    method: "POST",
    headers: {
      ...TEST_HEADERS,
      ...options?.headers,
    },
    body: JSON.stringify({
      model,
      messages: options?.messages || [
        { role: "user", content: TEST_USER_MESSAGE },
      ],
      max_tokens: options?.maxTokens || TEST_MAX_TOKENS,
    }),
  };
}

/**
 * Create a mock response for Anthropic models
 */
export function createAnthropicMockResponse(model: string) {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    content: [{ type: "text", text: `Test response from ${model}` }],
    model: model.includes("/") ? model.split("/")[0] : model,
    usage: { input_tokens: 10, output_tokens: 5 },
  };
}

/**
 * Create a mock response for OpenAI models
 */
export function createOpenAIMockResponse(model: string) {
  return {
    id: "chatcmpl-test",
    object: "chat.completion",
    created: Date.now(),
    model: model.includes("/") ? model.split("/")[0] : model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: `Test response from ${model}`,
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 5,
      total_tokens: 15,
    },
  };
}

/**
 * Create a mock response for Google Gemini models
 */
export function createGoogleMockResponse(model: string) {
  return {
    candidates: [
      {
        content: {
          parts: [{ text: `Test response from ${model}` }],
          role: "model",
        },
        finishReason: "STOP",
        safetyRatings: [],
        citationMetadata: { citationSources: [] },
      },
    ],
    promptFeedback: {
      safetyRatings: [],
    },
    usageMetadata: {
      promptTokenCount: 10,
      candidatesTokenCount: 5,
      totalTokenCount: 15,
    },
  };
}

/**
 * Create a mock response for Vertex AI
 */
export function createVertexMockResponse(model: string) {
  return {
    candidates: [
      {
        content: {
          parts: [{ text: `Test response from Vertex ${model}` }],
          role: "model",
        },
        finishReason: "STOP",
      },
    ],
    usageMetadata: {
      promptTokenCount: 10,
      candidatesTokenCount: 5,
      totalTokenCount: 15,
    },
  };
}

/**
 * Setup common test environment
 */
export function setupTestEnvironment() {
  fetchMock.activate();
  fetchMock.disableNetConnect();

  // Mock S3 and logging services
  const s3Mock = fetchMock
    .get(TEST_ENDPOINTS.S3)
    .intercept({
      path: /.*/,
      method: "PUT",
    })
    .reply(() => ({
      statusCode: 200,
      data: "",
    }))
    .persist();

  const loggingMock = fetchMock
    .get(TEST_ENDPOINTS.LOGGING)
    .intercept({
      path: "/v1/log/request",
      method: "POST",
    })
    .reply(() => ({
      statusCode: 200,
      data: { success: true },
    }))
    .persist();

  return { s3Mock, loggingMock };
}

/**
 * Cleanup test environment
 */
export function cleanupTestEnvironment() {
  fetchMock.deactivate();
}

/**
 * Mock Anthropic endpoint for AI Gateway tests
 * The AI Gateway uses OpenAI-compatible endpoints for Anthropic
 */
export function mockAnthropicEndpoint(modelName: string) {
  return fetchMock
    .get("https://api.anthropic.com")
    .intercept({
      path: "/v1/chat/completions",
      method: "POST",
    })
    .reply(() => ({
      statusCode: 200,
      data: createAnthropicMockResponse(modelName),
    }))
    .persist();
}

/**
 * Mock Vertex AI endpoint for Anthropic models
 */
export function mockVertexAnthropicEndpoint(modelId: string) {
  const projectId = "test-project";
  const region = "us-central1";

  return fetchMock
    .get(`https://${region}-aiplatform.googleapis.com`)
    .intercept({
      path: `/v1/projects/${projectId}/locations/${region}/publishers/anthropic/models/${modelId}:streamRawPredict`,
      method: "POST",
    })
    .reply(() => ({
      statusCode: 200,
      data: createVertexMockResponse(modelId),
    }))
    .persist();
}

/**
 * Mock Bedrock endpoint for Anthropic models
 */
export function mockBedrockAnthropicEndpoint(modelId: string) {
  const region = "us-east-1";

  return fetchMock
    .get(`https://bedrock-runtime.${region}.amazonaws.com`)
    .intercept({
      path: `/model/${modelId}/invoke`,
      method: "POST",
    })
    .reply(() => ({
      statusCode: 200,
      data: createAnthropicMockResponse(modelId),
    }))
    .persist();
}

export function mockGoogleEndpoint(modelName: string) {
  return fetchMock
    .get("https://generativelanguage.googleapis.com")
    .intercept({
      path: `/v1beta/openai/chat/completions`,
      method: "POST",
    })
    .reply(() => ({
      statusCode: 200,
      data: createOpenAIMockResponse(modelName),
    }))
    .persist();
}

/**
 * Mock OpenAI endpoint for OpenAI models
 */
export function mockOpenAIEndpoint(modelName: string) {
  return fetchMock
    .get("https://api.openai.com")
    .intercept({
      path: "/v1/chat/completions",
      method: "POST",
    })
    .reply(() => ({
      statusCode: 200,
      data: createOpenAIMockResponse(modelName),
    }))
    .persist();
}

/**
 * Mock Groq endpoint for OpenAI OSS models
 */
export function mockGroqEndpoint(modelName: string) {
  // Groq uses the full model ID like "openai/gpt-oss-120b"
  const groqModelId = modelName.startsWith("openai/") ? modelName : `openai/${modelName}`;
  
  return fetchMock
    .get("https://api.groq.com")
    .intercept({
      path: "/openai/v1/chat/completions",
      method: "POST",
    })
    .reply(() => ({
      statusCode: 200,
      data: {
        ...createOpenAIMockResponse(modelName),
        model: groqModelId,
      },
    }))
    .persist();
}

/**
 * Create a test request to AI Gateway
 */
export function createAIGatewayRequest(
  model: string,
  options?: {
    messages?: Array<{ role: string; content: string }>;
    maxTokens?: number;
  }
) {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd",
    },
    body: JSON.stringify({
      model,
      messages: options?.messages || [
        { role: "user", content: TEST_USER_MESSAGE },
      ],
      max_tokens: options?.maxTokens || TEST_MAX_TOKENS,
    }),
  };
}
