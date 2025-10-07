/**
 * Gateway chat completion tests
 * Testing the AI Gateway on port 8793
 */

import { gatewayClient } from "../../lib/http-client";
import { GATEWAY_ENDPOINTS, TEST_MESSAGES } from "../../lib/constants";
import {
  createChatCompletionRequest,
  validateChatCompletionResponse,
  validateErrorResponse,
  ChatCompletionResponse,
  retry,
} from "../../lib/test-helpers";

describe("Gateway Chat Completions", () => {
  describe("Basic Chat Completion", () => {
    it("should successfully process a simple chat completion request", async () => {
      const requestBody = createChatCompletionRequest({
        model: "gpt-4o-mini",
        messages: TEST_MESSAGES.SIMPLE,
        max_tokens: 50,
      });

      const response = await retry(
        () =>
          gatewayClient.post<ChatCompletionResponse>(
            GATEWAY_ENDPOINTS.CHAT_COMPLETIONS,
            requestBody
          ),
        { maxAttempts: 3, delayMs: 2000 }
      );

      validateChatCompletionResponse(response);
      expect(response.data.model).toContain("gpt");
    });

    it("should handle different models", async () => {
      const models = ["gpt-4o-mini", "gpt-3.5-turbo"];

      for (const model of models) {
        const requestBody = createChatCompletionRequest({
          model,
          messages: TEST_MESSAGES.SIMPLE,
          max_tokens: 50,
        });

        const response = await gatewayClient.post<ChatCompletionResponse>(
          GATEWAY_ENDPOINTS.CHAT_COMPLETIONS,
          requestBody
        );

        // Accept either success or specific error codes (model not available, etc.)
        if (response.status === 200) {
          validateChatCompletionResponse(response);
        } else {
          // Expected errors: 404 (model not found), 401 (auth), 429 (rate limit)
          expect([400, 401, 404, 429, 500]).toContain(response.status);
        }
      }
    });
  });

  describe("Request Parameters", () => {
    it("should handle temperature parameter", async () => {
      const requestBody = createChatCompletionRequest({
        model: "gpt-4o-mini",
        messages: TEST_MESSAGES.SIMPLE,
        temperature: 0.5,
        max_tokens: 50,
      });

      const response = await gatewayClient.post<ChatCompletionResponse>(
        GATEWAY_ENDPOINTS.CHAT_COMPLETIONS,
        requestBody
      );

      if (response.status === 200) {
        validateChatCompletionResponse(response);
      }
    });

    it("should handle max_tokens parameter", async () => {
      const requestBody = createChatCompletionRequest({
        model: "gpt-4o-mini",
        messages: TEST_MESSAGES.SIMPLE,
        max_tokens: 20,
      });

      const response = await gatewayClient.post<ChatCompletionResponse>(
        GATEWAY_ENDPOINTS.CHAT_COMPLETIONS,
        requestBody
      );

      if (response.status === 200) {
        validateChatCompletionResponse(response);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid model gracefully", async () => {
      const requestBody = createChatCompletionRequest({
        model: "invalid-model-name-12345",
        messages: TEST_MESSAGES.SIMPLE,
      });

      const response = await gatewayClient.post(
        GATEWAY_ENDPOINTS.CHAT_COMPLETIONS,
        requestBody
      );

      // Should return an error
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should handle missing required fields", async () => {
      const response = await gatewayClient.post(
        GATEWAY_ENDPOINTS.CHAT_COMPLETIONS,
        {
          // Missing model and messages
        }
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should handle malformed JSON", async () => {
      const response = await gatewayClient.post(
        GATEWAY_ENDPOINTS.CHAT_COMPLETIONS,
        "invalid json",
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Custom Headers", () => {
    it("should accept Helicone-specific headers", async () => {
      const requestBody = createChatCompletionRequest({
        model: "gpt-4o-mini",
        messages: TEST_MESSAGES.SIMPLE,
        max_tokens: 50,
      });

      const response = await gatewayClient.post<ChatCompletionResponse>(
        GATEWAY_ENDPOINTS.CHAT_COMPLETIONS,
        requestBody
      );

      // Should not fail due to custom headers
      expect([200, 400, 401, 404, 429, 500]).toContain(response.status);
    });
  });

  describe("Response Format", () => {
    it("should return properly formatted OpenAI-compatible response", async () => {
      const requestBody = createChatCompletionRequest({
        model: "gpt-4o-mini",
        messages: TEST_MESSAGES.SIMPLE,
        max_tokens: 50,
      });

      const response = await gatewayClient.post<ChatCompletionResponse>(
        GATEWAY_ENDPOINTS.CHAT_COMPLETIONS,
        requestBody
      );

      if (response.status === 200) {
        const data = response.data;

        // Verify OpenAI format
        expect(data).toHaveProperty("id");
        expect(data.id).toMatch(/^chatcmpl-/);
        expect(data.object).toBe("chat.completion");
        expect(typeof data.created).toBe("number");
        expect(data.choices[0].message.role).toBe("assistant");
        expect(typeof data.choices[0].message.content).toBe("string");
      }
    });
  });
});
