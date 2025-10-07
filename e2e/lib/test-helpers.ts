/**
 * Common test helper functions
 */

import { AxiosResponse } from "axios";

/**
 * OpenAI Chat Completion Response Type
 */
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Create a chat completion request body
 */
export function createChatCompletionRequest(options: {
  model: string;
  messages: ReadonlyArray<{ readonly role: string; readonly content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}) {
  return {
    model: options.model,
    messages: [...options.messages] as Array<{ role: string; content: string }>,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 100,
    stream: options.stream ?? false,
  };
}

/**
 * Validate that a response is a valid OpenAI chat completion
 */
export function validateChatCompletionResponse(
  response: AxiosResponse<ChatCompletionResponse>
): void {
  expect(response.status).toBe(200);
  expect(response.data).toHaveProperty("id");
  expect(response.data).toHaveProperty("object");
  expect(response.data).toHaveProperty("created");
  expect(response.data).toHaveProperty("model");
  expect(response.data).toHaveProperty("choices");
  expect(Array.isArray(response.data.choices)).toBe(true);
  expect(response.data.choices.length).toBeGreaterThan(0);

  const firstChoice = response.data.choices[0];
  expect(firstChoice).toHaveProperty("message");
  expect(firstChoice.message).toHaveProperty("role");
  expect(firstChoice.message).toHaveProperty("content");
}

/**
 * Validate error response structure
 */
export function validateErrorResponse(response: AxiosResponse): void {
  expect(response.status).toBeGreaterThanOrEqual(400);
  expect(response.data).toHaveProperty("error");
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const delayMs = options.delayMs ?? 1000;
  const backoffMultiplier = options.backoffMultiplier ?? 2;

  let lastError: Error;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await sleep(delayMs * Math.pow(backoffMultiplier, attempt - 1));
      }
    }
  }
  throw lastError!;
}
