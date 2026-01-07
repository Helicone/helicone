import { describe, it, beforeEach, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";
import { createOpenAIMockResponse } from "../test-utils";

/**
 * io.net Intelligence Registry Tests
 *
 * Tests for io.net Intelligence provider integration with the AI Gateway.
 * io.net Intelligence is an OpenAI-compatible inference provider.
 */

const ioIntelligenceAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

describe("io.net Intelligence Registry Tests", () => {
  beforeEach(() => {
    // Clear all mocks between tests
    vi.clearAllMocks();
  });

  describe("BYOK Tests - DeepSeek Models via io.net Intelligence", () => {
    describe("deepseek-reasoner", () => {
      it("should handle io-intelligence provider", () =>
        runGatewayTest({
          model: "deepseek-reasoner/io-intelligence",
          expected: {
            providers: [
              {
                url: "https://api.intelligence.io.solutions/api/v1/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-R1-0528",
                data: createOpenAIMockResponse("deepseek-ai/DeepSeek-R1-0528"),
                expects: ioIntelligenceAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });

    describe("deepseek-v3.2", () => {
      it("should handle io-intelligence provider", () =>
        runGatewayTest({
          model: "deepseek-v3.2/io-intelligence",
          expected: {
            providers: [
              {
                url: "https://api.intelligence.io.solutions/api/v1/chat/completions",
                response: "success",
                model: "deepseek-ai/DeepSeek-V3.2",
                data: createOpenAIMockResponse("deepseek-ai/DeepSeek-V3.2"),
                expects: ioIntelligenceAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });

  describe("BYOK Tests - Mistral Models via io.net Intelligence", () => {
    describe("mistral-large-2411", () => {
      it("should handle io-intelligence provider", () =>
        runGatewayTest({
          model: "mistral-large-2411/io-intelligence",
          expected: {
            providers: [
              {
                url: "https://api.intelligence.io.solutions/api/v1/chat/completions",
                response: "success",
                model: "mistralai/Mistral-Large-Instruct-2411",
                data: createOpenAIMockResponse(
                  "mistralai/Mistral-Large-Instruct-2411"
                ),
                expects: ioIntelligenceAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });

  describe("BYOK Tests - OpenAI OSS Models via io.net Intelligence", () => {
    describe("gpt-oss-120b", () => {
      it("should handle io-intelligence provider", () =>
        runGatewayTest({
          model: "gpt-oss-120b/io-intelligence",
          expected: {
            providers: [
              {
                url: "https://api.intelligence.io.solutions/api/v1/chat/completions",
                response: "success",
                model: "openai/gpt-oss-120b",
                data: createOpenAIMockResponse("openai/gpt-oss-120b"),
                expects: ioIntelligenceAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });

  describe("BYOK Tests - Zai GLM Models via io.net Intelligence", () => {
    describe("glm-4.6", () => {
      it("should handle io-intelligence provider", () =>
        runGatewayTest({
          model: "glm-4.6/io-intelligence",
          expected: {
            providers: [
              {
                url: "https://api.intelligence.io.solutions/api/v1/chat/completions",
                response: "success",
                model: "zai-org/GLM-4.6",
                data: createOpenAIMockResponse("zai-org/GLM-4.6"),
                expects: ioIntelligenceAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });

  describe("BYOK Tests - Llama Models via io.net Intelligence", () => {
    describe("llama-4-maverick", () => {
      it("should handle io-intelligence provider", () =>
        runGatewayTest({
          model: "llama-4-maverick/io-intelligence",
          expected: {
            providers: [
              {
                url: "https://api.intelligence.io.solutions/api/v1/chat/completions",
                response: "success",
                model: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
                data: createOpenAIMockResponse(
                  "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8"
                ),
                expects: ioIntelligenceAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });

  describe("Error Handling Tests", () => {
    it("should handle 429 rate limit errors from io-intelligence", () =>
      runGatewayTest({
        model: "deepseek-reasoner/io-intelligence",
        expected: {
          providers: [
            {
              url: "https://api.intelligence.io.solutions/api/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              model: "deepseek-ai/DeepSeek-R1-0528",
              expects: ioIntelligenceAuthExpectations,
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle 500 server errors from io-intelligence", () =>
      runGatewayTest({
        model: "gpt-oss-120b/io-intelligence",
        expected: {
          providers: [
            {
              url: "https://api.intelligence.io.solutions/api/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              model: "openai/gpt-oss-120b",
              expects: ioIntelligenceAuthExpectations,
            },
          ],
          finalStatus: 500,
        },
      }));
  });
});
