import { describe, it, beforeEach, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";
import { createOpenAIMockResponse } from "../test-utils";

// Define auth expectations for Novita provider
const novitaAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

// Define auth expectations for DeepInfra provider
const deepinfraAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

// Define auth expectations for Baseten provider
const basetenAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

// Define auth expectations for Fireworks provider
const fireworksAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

// Define auth expectations for OpenRouter provider
const openrouterAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

// Define auth expectations for Canopy Wave provider
const canopywaveAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

describe("Moonshot AI Registry Tests", () => {
  beforeEach(() => {
    // Clear all mocks between tests
    vi.clearAllMocks();
  });

  describe("BYOK Tests - Kimi K2 Models", () => {
    describe("kimi-k2-instruct", () => {
      it("should handle novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-instruct/novita",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-0905",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-0905"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tool calls with novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-instruct/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "What's the weather?" }],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "get_weather",
                    description: "Get current weather",
                    parameters: {
                      type: "object",
                      properties: {
                        location: { type: "string" },
                      },
                      required: ["location"],
                    },
                  },
                },
              ],
              tool_choice: "auto",
              temperature: 0.7,
              max_tokens: 1000,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-0905",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-0905"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "tools",
                    "tool_choice",
                    "get_weather",
                    "temperature",
                    "max_tokens",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle response format with novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-instruct/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "Generate JSON data" }],
              response_format: { type: "json_object" },
              temperature: 0.1,
              top_p: 0.9,
              frequency_penalty: 0.5,
              presence_penalty: 0.3,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-0905",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-0905"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_object",
                    "temperature",
                    "top_p",
                    "frequency_penalty",
                    "presence_penalty",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle structured outputs with novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-instruct/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "Extract data" }],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "data_extraction",
                  schema: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      age: { type: "number" },
                    },
                    required: ["name", "age"],
                  },
                },
              },
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-0905",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-0905"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_schema",
                    "data_extraction",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle functions parameter with novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-instruct/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "Call a function" }],
              functions: [
                {
                  name: "calculate_sum",
                  description: "Calculate sum of two numbers",
                  parameters: {
                    type: "object",
                    properties: {
                      a: { type: "number" },
                      b: { type: "number" },
                    },
                    required: ["a", "b"],
                  },
                },
              ],
              function_call: "auto",
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-0905",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-0905"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: ["functions", "function_call", "calculate_sum"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle all supported parameters with novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-instruct/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Test comprehensive parameters" },
              ],
              max_tokens: 1000,
              temperature: 0.8,
              top_p: 0.95,
              stop: ["STOP"],
              frequency_penalty: 0.2,
              presence_penalty: 0.1,
              seed: 12345,
              logprobs: true,
              top_logprobs: 5,
              response_format: { type: "text" },
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-0905",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-0905"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "max_tokens",
                    "temperature",
                    "top_p",
                    "stop",
                    "frequency_penalty",
                    "presence_penalty",
                    "seed",
                    "logprobs",
                    "top_logprobs",
                    "response_format",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });

  describe("Error scenarios - kimi-k2-instruct with Novita Provider", () => {
    it("should handle Novita provider failure", () =>
      runGatewayTest({
        model: "kimi-k2-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Novita service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from Novita", () =>
      runGatewayTest({
        model: "kimi-k2-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from Novita", () =>
      runGatewayTest({
        model: "kimi-k2-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
            },
          ],
          finalStatus: 401,
        },
      }));

    it("should handle model not found error from Novita", () =>
      runGatewayTest({
        model: "kimi-k2-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 404,
              errorMessage: "Model not found",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle timeout from Novita", () =>
      runGatewayTest({
        model: "kimi-k2-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 408,
              errorMessage: "Request timeout",
            },
          ],
          finalStatus: 500,
        },
      }));
  });

  describe("Provider validation - kimi-k2-instruct with Novita", () => {
    it("should construct correct Novita URL for kimi-k2-instruct", () =>
      runGatewayTest({
        model: "kimi-k2-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "moonshotai/kimi-k2-0905",
              data: createOpenAIMockResponse("moonshotai/kimi-k2-0905"),
              expects: novitaAuthExpectations,
              customVerify: (call) => {
                // Verify that the URL is correctly constructed
                // Base URL: https://api.novita.ai/openai/v1
                // Built URL: https://api.novita.ai/openai/v1/chat/completions
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for Novita", () =>
      runGatewayTest({
        model: "kimi-k2-instruct/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "moonshotai/kimi-k2-0905", // Should map to the correct provider model ID
              data: createOpenAIMockResponse("moonshotai/kimi-k2-0905"),
              expects: novitaAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for Novita", () =>
      runGatewayTest({
        model: "kimi-k2-instruct/novita",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "moonshotai/kimi-k2-0905",
              data: createOpenAIMockResponse("moonshotai/kimi-k2-0905"),
              expects: {
                ...novitaAuthExpectations,
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });

  describe("BYOK Tests - kimi-k2-0711", () => {
    describe("kimi-k2-0711", () => {
      it("should handle openrouter provider", () =>
        runGatewayTest({
          model: "kimi-k2-0711/openrouter",
          expected: {
            providers: [
              {
                url: "https://openrouter.ai/api/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2",
                data: createOpenAIMockResponse("moonshotai/kimi-k2"),
                expects: openrouterAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-0711/novita",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-instruct",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-instruct"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should map kimi-k2 to kimi-k2-0905 with openrouter provider", () =>
        runGatewayTest({
          model: "kimi-k2/openrouter",
          expected: {
            providers: [
              {
                url: "https://openrouter.ai/api/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-0905",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-0905"),
                expects: openrouterAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should map kimi-k2 to kimi-k2-0905 with novita provider", () =>
        runGatewayTest({
          model: "kimi-k2/novita",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-0905",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-0905"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tool calls with openrouter provider", () =>
        runGatewayTest({
          model: "kimi-k2-0711/openrouter",
          request: {
            body: {
              messages: [{ role: "user", content: "What's the weather?" }],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "get_weather",
                    description: "Get current weather",
                    parameters: {
                      type: "object",
                      properties: {
                        location: { type: "string" },
                      },
                      required: ["location"],
                    },
                  },
                },
              ],
              tool_choice: "auto",
              temperature: 0.7,
              max_tokens: 1000,
            },
          },
          expected: {
            providers: [
              {
                url: "https://openrouter.ai/api/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2",
                data: createOpenAIMockResponse("moonshotai/kimi-k2"),
                expects: {
                  ...openrouterAuthExpectations,
                  bodyContains: [
                    "tools",
                    "tool_choice",
                    "get_weather",
                    "temperature",
                    "max_tokens",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tool calls with novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-0711/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "What's the weather?" }],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "get_weather",
                    description: "Get current weather",
                    parameters: {
                      type: "object",
                      properties: {
                        location: { type: "string" },
                      },
                      required: ["location"],
                    },
                  },
                },
              ],
              tool_choice: "auto",
              temperature: 0.7,
              max_tokens: 1000,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-instruct",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-instruct"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "tools",
                    "tool_choice",
                    "get_weather",
                    "temperature",
                    "max_tokens",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle response format with openrouter provider", () =>
        runGatewayTest({
          model: "kimi-k2-0711/openrouter",
          request: {
            body: {
              messages: [{ role: "user", content: "Generate JSON data" }],
              response_format: { type: "json_object" },
              temperature: 0.1,
              top_p: 0.9,
              frequency_penalty: 0.5,
              presence_penalty: 0.3,
            },
          },
          expected: {
            providers: [
              {
                url: "https://openrouter.ai/api/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2",
                data: createOpenAIMockResponse("moonshotai/kimi-k2"),
                expects: {
                  ...openrouterAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_object",
                    "temperature",
                    "top_p",
                    "frequency_penalty",
                    "presence_penalty",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle response format with novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-0711/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "Generate JSON data" }],
              response_format: { type: "json_object" },
              temperature: 0.1,
              top_p: 0.9,
              frequency_penalty: 0.5,
              presence_penalty: 0.3,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-instruct",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-instruct"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_object",
                    "temperature",
                    "top_p",
                    "frequency_penalty",
                    "presence_penalty",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle structured outputs with openrouter provider", () =>
        runGatewayTest({
          model: "kimi-k2-0711/openrouter",
          request: {
            body: {
              messages: [{ role: "user", content: "Extract data" }],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "data_extraction",
                  schema: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      age: { type: "number" },
                    },
                    required: ["name", "age"],
                  },
                },
              },
            },
          },
          expected: {
            providers: [
              {
                url: "https://openrouter.ai/api/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2",
                data: createOpenAIMockResponse("moonshotai/kimi-k2"),
                expects: {
                  ...openrouterAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_schema",
                    "data_extraction",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle structured outputs with novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-0711/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "Extract data" }],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "data_extraction",
                  schema: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      age: { type: "number" },
                    },
                    required: ["name", "age"],
                  },
                },
              },
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-instruct",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-instruct"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_schema",
                    "data_extraction",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle all supported parameters with openrouter provider", () =>
        runGatewayTest({
          model: "kimi-k2-0711/openrouter",
          request: {
            body: {
              messages: [
                { role: "user", content: "Test comprehensive parameters" },
              ],
              max_tokens: 1000,
              temperature: 0.8,
              top_p: 0.95,
              stop: ["STOP"],
              frequency_penalty: 0.2,
              presence_penalty: 0.1,
              seed: 12345,
              logprobs: true,
              top_logprobs: 5,
              response_format: { type: "text" },
            },
          },
          expected: {
            providers: [
              {
                url: "https://openrouter.ai/api/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2",
                data: createOpenAIMockResponse("moonshotai/kimi-k2"),
                expects: {
                  ...openrouterAuthExpectations,
                  bodyContains: [
                    "max_tokens",
                    "temperature",
                    "top_p",
                    "stop",
                    "frequency_penalty",
                    "presence_penalty",
                    "seed",
                    "logprobs",
                    "top_logprobs",
                    "response_format",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle all supported parameters with novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-0711/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Test comprehensive parameters" },
              ],
              max_tokens: 1000,
              temperature: 0.8,
              top_p: 0.95,
              stop: ["STOP"],
              frequency_penalty: 0.2,
              presence_penalty: 0.1,
              seed: 12345,
              logprobs: true,
              top_logprobs: 5,
              response_format: { type: "text" },
              structured_outputs: true,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-instruct",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-instruct"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "max_tokens",
                    "temperature",
                    "top_p",
                    "stop",
                    "frequency_penalty",
                    "presence_penalty",
                    "seed",
                    "logprobs",
                    "top_logprobs",
                    "response_format",
                    "structured_outputs",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });

  describe("Error scenarios - kimi-k2-0711 with OpenRouter Provider", () => {
    it("should handle OpenRouter provider failure", () =>
      runGatewayTest({
        model: "kimi-k2-0711/openrouter",
        expected: {
          providers: [
            {
              url: "https://openrouter.ai/api/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "OpenRouter service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from OpenRouter", () =>
      runGatewayTest({
        model: "kimi-k2-0711/openrouter",
        expected: {
          providers: [
            {
              url: "https://openrouter.ai/api/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from OpenRouter", () =>
      runGatewayTest({
        model: "kimi-k2-0711/openrouter",
        expected: {
          providers: [
            {
              url: "https://openrouter.ai/api/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
            },
          ],
          finalStatus: 401,
        },
      }));

    it("should handle model not found error from OpenRouter", () =>
      runGatewayTest({
        model: "kimi-k2-0711/openrouter",
        expected: {
          providers: [
            {
              url: "https://openrouter.ai/api/v1/chat/completions",
              response: "failure",
              statusCode: 404,
              errorMessage: "Model not found",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle timeout from OpenRouter", () =>
      runGatewayTest({
        model: "kimi-k2-0711/openrouter",
        expected: {
          providers: [
            {
              url: "https://openrouter.ai/api/v1/chat/completions",
              response: "failure",
              statusCode: 408,
              errorMessage: "Request timeout",
            },
          ],
          finalStatus: 500,
        },
      }));
  });

  describe("Error scenarios - kimi-k2-0711 with Novita Provider", () => {
    it("should handle Novita provider failure", () =>
      runGatewayTest({
        model: "kimi-k2-0711/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Novita service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from Novita", () =>
      runGatewayTest({
        model: "kimi-k2-0711/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from Novita", () =>
      runGatewayTest({
        model: "kimi-k2-0711/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
            },
          ],
          finalStatus: 401,
        },
      }));

    it("should handle model not found error from Novita", () =>
      runGatewayTest({
        model: "kimi-k2-0711/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 404,
              errorMessage: "Model not found",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle timeout from Novita", () =>
      runGatewayTest({
        model: "kimi-k2-0711/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 408,
              errorMessage: "Request timeout",
            },
          ],
          finalStatus: 500,
        },
      }));
  });

  describe("Provider validation - kimi-k2-0711 with OpenRouter", () => {
    it("should construct correct OpenRouter URL for kimi-k2-0711", () =>
      runGatewayTest({
        model: "kimi-k2-0711/openrouter",
        expected: {
          providers: [
            {
              url: "https://openrouter.ai/api/v1/chat/completions",
              response: "success",
              model: "moonshotai/kimi-k2",
              data: createOpenAIMockResponse("moonshotai/kimi-k2"),
              expects: openrouterAuthExpectations,
              customVerify: (call) => {
                // Verify that the URL is correctly constructed
                // Base URL: https://openrouter.ai/api/v1
                // Built URL: https://openrouter.ai/api/v1/chat/completions
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for OpenRouter", () =>
      runGatewayTest({
        model: "kimi-k2-0711/openrouter",
        expected: {
          providers: [
            {
              url: "https://openrouter.ai/api/v1/chat/completions",
              response: "success",
              model: "moonshotai/kimi-k2", // Should map to the correct provider model ID
              data: createOpenAIMockResponse("moonshotai/kimi-k2"),
              expects: openrouterAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for OpenRouter", () =>
      runGatewayTest({
        model: "kimi-k2-0711/openrouter",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://openrouter.ai/api/v1/chat/completions",
              response: "success",
              model: "moonshotai/kimi-k2",
              data: createOpenAIMockResponse("moonshotai/kimi-k2"),
              expects: {
                ...openrouterAuthExpectations,
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });

  describe("Provider validation - kimi-k2-0711 with Novita", () => {
    it("should construct correct Novita URL for kimi-k2-0711", () =>
      runGatewayTest({
        model: "kimi-k2-0711/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "moonshotai/kimi-k2-instruct",
              data: createOpenAIMockResponse("moonshotai/kimi-k2-instruct"),
              expects: novitaAuthExpectations,
              customVerify: (call) => {
                // Verify that the URL is correctly constructed
                // Base URL: https://api.novita.ai/openai/v1
                // Built URL: https://api.novita.ai/openai/v1/chat/completions
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for Novita", () =>
      runGatewayTest({
        model: "kimi-k2-0711/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "moonshotai/kimi-k2-instruct", // Should map to the correct provider model ID
              data: createOpenAIMockResponse("moonshotai/kimi-k2-instruct"),
              expects: novitaAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for Novita", () =>
      runGatewayTest({
        model: "kimi-k2-0711/novita",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "moonshotai/kimi-k2-instruct",
              data: createOpenAIMockResponse("moonshotai/kimi-k2-instruct"),
              expects: {
                ...novitaAuthExpectations,
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });

  describe("BYOK Tests - kimi-k2-0905", () => {
    describe("kimi-k2-0905", () => {
      it("should handle novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/novita",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-0905",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-0905"),
                expects: novitaAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tool calls with novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "What's the weather?" }],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "get_weather",
                    description: "Get current weather",
                    parameters: {
                      type: "object",
                      properties: {
                        location: { type: "string" },
                      },
                      required: ["location"],
                    },
                  },
                },
              ],
              tool_choice: "auto",
              temperature: 0.7,
              max_tokens: 1000,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-0905",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-0905"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "tools",
                    "tool_choice",
                    "get_weather",
                    "temperature",
                    "max_tokens",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle response format with novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "Generate JSON data" }],
              response_format: { type: "json_object" },
              temperature: 0.1,
              frequency_penalty: 0.5,
              presence_penalty: 0.3,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-0905",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-0905"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_object",
                    "temperature",
                    "frequency_penalty",
                    "presence_penalty",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle structured outputs with novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "Extract data" }],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "data_extraction",
                  schema: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      age: { type: "number" },
                    },
                    required: ["name", "age"],
                  },
                },
              },
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-0905",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-0905"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_schema",
                    "data_extraction",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle functions parameter with novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "Call a function" }],
              functions: [
                {
                  name: "calculate_sum",
                  description: "Calculate sum of two numbers",
                  parameters: {
                    type: "object",
                    properties: {
                      a: { type: "number" },
                      b: { type: "number" },
                    },
                    required: ["a", "b"],
                  },
                },
              ],
              function_call: "auto",
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-0905",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-0905"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: ["functions", "function_call", "calculate_sum"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle all supported parameters with novita provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Test comprehensive parameters" },
              ],
              max_tokens: 1000,
              temperature: 0.8,
              stop: ["STOP"],
              frequency_penalty: 0.2,
              presence_penalty: 0.1,
              seed: 12345,
              top_k: 50,
              min_p: 0.05,
              repetition_penalty: 1.1,
              logit_bias: { "50256": -100 },
              response_format: { type: "text" },
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-0905",
                data: createOpenAIMockResponse("moonshotai/kimi-k2-0905"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "max_tokens",
                    "temperature",
                    "stop",
                    "frequency_penalty",
                    "presence_penalty",
                    "seed",
                    "top_k",
                    "min_p",
                    "repetition_penalty",
                    "logit_bias",
                    "response_format",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });

  describe("Error scenarios - kimi-k2-0905 with Novita Provider", () => {
    it("should handle Novita provider failure", () =>
      runGatewayTest({
        model: "kimi-k2-0905/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Novita service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from Novita", () =>
      runGatewayTest({
        model: "kimi-k2-0905/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from Novita", () =>
      runGatewayTest({
        model: "kimi-k2-0905/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
            },
          ],
          finalStatus: 401,
        },
      }));

    it("should handle model not found error from Novita", () =>
      runGatewayTest({
        model: "kimi-k2-0905/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 404,
              errorMessage: "Model not found",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle timeout from Novita", () =>
      runGatewayTest({
        model: "kimi-k2-0905/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 408,
              errorMessage: "Request timeout",
            },
          ],
          finalStatus: 500,
        },
      }));
  });

  describe("Provider validation - kimi-k2-0905 with Novita", () => {
    it("should construct correct Novita URL for kimi-k2-0905", () =>
      runGatewayTest({
        model: "kimi-k2-0905/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "moonshotai/kimi-k2-0905",
              data: createOpenAIMockResponse("moonshotai/kimi-k2-0905"),
              expects: novitaAuthExpectations,
              customVerify: (call) => {
                // Verify that the URL is correctly constructed
                // Base URL: https://api.novita.ai/openai/v1
                // Built URL: https://api.novita.ai/openai/v1/chat/completions
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for Novita", () =>
      runGatewayTest({
        model: "kimi-k2-0905/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "moonshotai/kimi-k2-0905", // Should map to the correct provider model ID
              data: createOpenAIMockResponse("moonshotai/kimi-k2-0905"),
              expects: novitaAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for Novita", () =>
      runGatewayTest({
        model: "kimi-k2-0905/novita",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "moonshotai/kimi-k2-0905",
              data: createOpenAIMockResponse("moonshotai/kimi-k2-0905"),
              expects: {
                ...novitaAuthExpectations,
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });

  describe("BYOK Tests - kimi-k2-0905 with DeepInfra", () => {
    describe("kimi-k2-0905/deepinfra", () => {
      it("should handle deepinfra provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/deepinfra",
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "moonshotai/Kimi-K2-Instruct-0905",
                data: createOpenAIMockResponse(
                  "moonshotai/Kimi-K2-Instruct-0905"
                ),
                expects: deepinfraAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tool calls with deepinfra provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/deepinfra",
          request: {
            body: {
              messages: [{ role: "user", content: "What's the weather?" }],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "get_weather",
                    description: "Get current weather",
                    parameters: {
                      type: "object",
                      properties: {
                        location: { type: "string" },
                      },
                      required: ["location"],
                    },
                  },
                },
              ],
              tool_choice: "auto",
              temperature: 0.7,
              max_tokens: 1000,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "moonshotai/Kimi-K2-Instruct-0905",
                data: createOpenAIMockResponse(
                  "moonshotai/Kimi-K2-Instruct-0905"
                ),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: [
                    "tools",
                    "tool_choice",
                    "get_weather",
                    "temperature",
                    "max_tokens",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle response format with deepinfra provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/deepinfra",
          request: {
            body: {
              messages: [{ role: "user", content: "Generate JSON data" }],
              response_format: { type: "json_object" },
              temperature: 0.1,
              top_p: 0.9,
              frequency_penalty: 0.5,
              presence_penalty: 0.3,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "moonshotai/Kimi-K2-Instruct-0905",
                data: createOpenAIMockResponse(
                  "moonshotai/Kimi-K2-Instruct-0905"
                ),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_object",
                    "temperature",
                    "top_p",
                    "frequency_penalty",
                    "presence_penalty",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle structured outputs with deepinfra provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/deepinfra",
          request: {
            body: {
              messages: [{ role: "user", content: "Extract data" }],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "data_extraction",
                  schema: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      age: { type: "number" },
                    },
                    required: ["name", "age"],
                  },
                },
              },
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "moonshotai/Kimi-K2-Instruct-0905",
                data: createOpenAIMockResponse(
                  "moonshotai/Kimi-K2-Instruct-0905"
                ),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_schema",
                    "data_extraction",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle all supported parameters with deepinfra provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/deepinfra",
          request: {
            body: {
              messages: [
                { role: "user", content: "Test comprehensive parameters" },
              ],
              max_tokens: 1000,
              temperature: 0.8,
              top_p: 0.95,
              stop: ["STOP"],
              frequency_penalty: 0.2,
              presence_penalty: 0.1,
              repetition_penalty: 1.1,
              top_k: 50,
              seed: 12345,
              min_p: 0.05,
              response_format: { type: "text" },
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.deepinfra.com/v1/openai/chat/completions",
                response: "success",
                model: "moonshotai/Kimi-K2-Instruct-0905",
                data: createOpenAIMockResponse(
                  "moonshotai/Kimi-K2-Instruct-0905"
                ),
                expects: {
                  ...deepinfraAuthExpectations,
                  bodyContains: [
                    "max_tokens",
                    "temperature",
                    "top_p",
                    "stop",
                    "frequency_penalty",
                    "presence_penalty",
                    "repetition_penalty",
                    "top_k",
                    "seed",
                    "min_p",
                    "response_format",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });

  describe("Error scenarios - kimi-k2-0905 with DeepInfra Provider", () => {
    it("should handle DeepInfra provider failure", () =>
      runGatewayTest({
        model: "kimi-k2-0905/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "DeepInfra service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from DeepInfra", () =>
      runGatewayTest({
        model: "kimi-k2-0905/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from DeepInfra", () =>
      runGatewayTest({
        model: "kimi-k2-0905/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
            },
          ],
          finalStatus: 401,
        },
      }));

    it("should handle model not found error from DeepInfra", () =>
      runGatewayTest({
        model: "kimi-k2-0905/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "failure",
              statusCode: 404,
              errorMessage: "Model not found",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle timeout from DeepInfra", () =>
      runGatewayTest({
        model: "kimi-k2-0905/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "failure",
              statusCode: 408,
              errorMessage: "Request timeout",
            },
          ],
          finalStatus: 500,
        },
      }));
  });

  describe("Provider validation - kimi-k2-0905 with DeepInfra", () => {
    it("should construct correct DeepInfra URL for kimi-k2-0905", () =>
      runGatewayTest({
        model: "kimi-k2-0905/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "moonshotai/Kimi-K2-Instruct-0905",
              data: createOpenAIMockResponse(
                "moonshotai/Kimi-K2-Instruct-0905"
              ),
              expects: deepinfraAuthExpectations,
              customVerify: (call) => {
                // Verify that the URL is correctly constructed
                // Base URL: https://api.deepinfra.com/
                // Built URL: https://api.deepinfra.com/v1/openai/chat/completions
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for DeepInfra", () =>
      runGatewayTest({
        model: "kimi-k2-0905/deepinfra",
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "moonshotai/Kimi-K2-Instruct-0905", // Should map to the correct provider model ID
              data: createOpenAIMockResponse(
                "moonshotai/Kimi-K2-Instruct-0905"
              ),
              expects: deepinfraAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for DeepInfra", () =>
      runGatewayTest({
        model: "kimi-k2-0905/deepinfra",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://api.deepinfra.com/v1/openai/chat/completions",
              response: "success",
              model: "moonshotai/Kimi-K2-Instruct-0905",
              data: createOpenAIMockResponse(
                "moonshotai/Kimi-K2-Instruct-0905"
              ),
              expects: {
                ...deepinfraAuthExpectations,
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });

  describe("BYOK Tests - kimi-k2-0905 with Baseten", () => {
    describe("kimi-k2-0905/baseten", () => {
      it("should handle baseten provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/baseten",
          expected: {
            providers: [
              {
                url: "https://inference.baseten.co/v1/chat/completions",
                response: "success",
                model: "moonshotai/Kimi-K2-Instruct-0905",
                data: createOpenAIMockResponse(
                  "moonshotai/Kimi-K2-Instruct-0905"
                ),
                expects: basetenAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tool calls with baseten provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/baseten",
          request: {
            body: {
              messages: [{ role: "user", content: "What's the weather?" }],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "get_weather",
                    description: "Get current weather",
                    parameters: {
                      type: "object",
                      properties: {
                        location: { type: "string" },
                      },
                      required: ["location"],
                    },
                  },
                },
              ],
              tool_choice: "auto",
              temperature: 0.7,
              max_tokens: 1000,
            },
          },
          expected: {
            providers: [
              {
                url: "https://inference.baseten.co/v1/chat/completions",
                response: "success",
                model: "moonshotai/Kimi-K2-Instruct-0905",
                data: createOpenAIMockResponse(
                  "moonshotai/Kimi-K2-Instruct-0905"
                ),
                expects: {
                  ...basetenAuthExpectations,
                  bodyContains: [
                    "tools",
                    "tool_choice",
                    "get_weather",
                    "temperature",
                    "max_tokens",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle response format with baseten provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/baseten",
          request: {
            body: {
              messages: [{ role: "user", content: "Generate JSON data" }],
              response_format: { type: "json_object" },
              temperature: 0.1,
              frequency_penalty: 0.5,
              presence_penalty: 0.3,
            },
          },
          expected: {
            providers: [
              {
                url: "https://inference.baseten.co/v1/chat/completions",
                response: "success",
                model: "moonshotai/Kimi-K2-Instruct-0905",
                data: createOpenAIMockResponse(
                  "moonshotai/Kimi-K2-Instruct-0905"
                ),
                expects: {
                  ...basetenAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_object",
                    "temperature",
                    "frequency_penalty",
                    "presence_penalty",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle structured outputs with baseten provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/baseten",
          request: {
            body: {
              messages: [{ role: "user", content: "Extract data" }],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "data_extraction",
                  schema: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      age: { type: "number" },
                    },
                    required: ["name", "age"],
                  },
                },
              },
            },
          },
          expected: {
            providers: [
              {
                url: "https://inference.baseten.co/v1/chat/completions",
                response: "success",
                model: "moonshotai/Kimi-K2-Instruct-0905",
                data: createOpenAIMockResponse(
                  "moonshotai/Kimi-K2-Instruct-0905"
                ),
                expects: {
                  ...basetenAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_schema",
                    "data_extraction",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle all supported parameters with baseten provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/baseten",
          request: {
            body: {
              messages: [
                { role: "user", content: "Test comprehensive parameters" },
              ],
              max_tokens: 1000,
              temperature: 0.8,
              stop: ["STOP"],
              frequency_penalty: 0.2,
              presence_penalty: 0.1,
              response_format: { type: "text" },
            },
          },
          expected: {
            providers: [
              {
                url: "https://inference.baseten.co/v1/chat/completions",
                response: "success",
                model: "moonshotai/Kimi-K2-Instruct-0905",
                data: createOpenAIMockResponse(
                  "moonshotai/Kimi-K2-Instruct-0905"
                ),
                expects: {
                  ...basetenAuthExpectations,
                  bodyContains: [
                    "max_tokens",
                    "temperature",
                    "stop",
                    "frequency_penalty",
                    "presence_penalty",
                    "response_format",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });

  describe("Error scenarios - kimi-k2-0905 with Baseten Provider", () => {
    it("should handle Baseten provider failure", () =>
      runGatewayTest({
        model: "kimi-k2-0905/baseten",
        expected: {
          providers: [
            {
              url: "https://inference.baseten.co/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Baseten service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from Baseten", () =>
      runGatewayTest({
        model: "kimi-k2-0905/baseten",
        expected: {
          providers: [
            {
              url: "https://inference.baseten.co/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from Baseten", () =>
      runGatewayTest({
        model: "kimi-k2-0905/baseten",
        expected: {
          providers: [
            {
              url: "https://inference.baseten.co/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
            },
          ],
          finalStatus: 401,
        },
      }));

    it("should handle model not found error from Baseten", () =>
      runGatewayTest({
        model: "kimi-k2-0905/baseten",
        expected: {
          providers: [
            {
              url: "https://inference.baseten.co/v1/chat/completions",
              response: "failure",
              statusCode: 404,
              errorMessage: "Model not found",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle timeout from Baseten", () =>
      runGatewayTest({
        model: "kimi-k2-0905/baseten",
        expected: {
          providers: [
            {
              url: "https://inference.baseten.co/v1/chat/completions",
              response: "failure",
              statusCode: 408,
              errorMessage: "Request timeout",
            },
          ],
          finalStatus: 500,
        },
      }));
  });

  describe("Provider validation - kimi-k2-0905 with Baseten", () => {
    it("should construct correct Baseten URL for kimi-k2-0905", () =>
      runGatewayTest({
        model: "kimi-k2-0905/baseten",
        expected: {
          providers: [
            {
              url: "https://inference.baseten.co/v1/chat/completions",
              response: "success",
              model: "moonshotai/Kimi-K2-Instruct-0905",
              data: createOpenAIMockResponse(
                "moonshotai/Kimi-K2-Instruct-0905"
              ),
              expects: basetenAuthExpectations,
              customVerify: (call) => {
                // Verify that the URL is correctly constructed
                // Base URL: https://inference.baseten.co/
                // Built URL: https://inference.baseten.co/chat/completions
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for Baseten", () =>
      runGatewayTest({
        model: "kimi-k2-0905/baseten",
        expected: {
          providers: [
            {
              url: "https://inference.baseten.co/v1/chat/completions",
              response: "success",
              model: "moonshotai/Kimi-K2-Instruct-0905", // Should map to the correct provider model ID
              data: createOpenAIMockResponse(
                "moonshotai/Kimi-K2-Instruct-0905"
              ),
              expects: basetenAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for Baseten", () =>
      runGatewayTest({
        model: "kimi-k2-0905/baseten",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://inference.baseten.co/v1/chat/completions",
              response: "success",
              model: "moonshotai/Kimi-K2-Instruct-0905",
              data: createOpenAIMockResponse(
                "moonshotai/Kimi-K2-Instruct-0905"
              ),
              expects: {
                ...basetenAuthExpectations,
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });

  describe("BYOK Tests - kimi-k2-0905 with Fireworks", () => {
    describe("kimi-k2-0905/fireworks", () => {
      it("should handle fireworks provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/fireworks",
          expected: {
            providers: [
              {
                url: "https://api.fireworks.ai/inference/v1/chat/completions",
                response: "success",
                model: "accounts/fireworks/models/kimi-k2-instruct-0905",
                data: createOpenAIMockResponse(
                  "accounts/fireworks/models/kimi-k2-instruct-0905"
                ),
                expects: fireworksAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tool calls with fireworks provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/fireworks",
          request: {
            body: {
              messages: [{ role: "user", content: "What's the weather?" }],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "get_weather",
                    description: "Get current weather",
                    parameters: {
                      type: "object",
                      properties: {
                        location: { type: "string" },
                      },
                      required: ["location"],
                    },
                  },
                },
              ],
              tool_choice: "auto",
              temperature: 0.7,
              max_tokens: 1000,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.fireworks.ai/inference/v1/chat/completions",
                response: "success",
                model: "accounts/fireworks/models/kimi-k2-instruct-0905",
                data: createOpenAIMockResponse(
                  "accounts/fireworks/models/kimi-k2-instruct-0905"
                ),
                expects: {
                  ...fireworksAuthExpectations,
                  bodyContains: [
                    "tools",
                    "tool_choice",
                    "get_weather",
                    "temperature",
                    "max_tokens",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle response format with fireworks provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/fireworks",
          request: {
            body: {
              messages: [{ role: "user", content: "Generate JSON data" }],
              response_format: { type: "json_object" },
              temperature: 0.1,
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.fireworks.ai/inference/v1/chat/completions",
                response: "success",
                model: "accounts/fireworks/models/kimi-k2-instruct-0905",
                data: createOpenAIMockResponse(
                  "accounts/fireworks/models/kimi-k2-instruct-0905"
                ),
                expects: {
                  ...fireworksAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_object",
                    "temperature",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle structured outputs with fireworks provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/fireworks",
          request: {
            body: {
              messages: [{ role: "user", content: "Extract data" }],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "data_extraction",
                  schema: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      age: { type: "number" },
                    },
                    required: ["name", "age"],
                  },
                },
              },
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.fireworks.ai/inference/v1/chat/completions",
                response: "success",
                model: "accounts/fireworks/models/kimi-k2-instruct-0905",
                data: createOpenAIMockResponse(
                  "accounts/fireworks/models/kimi-k2-instruct-0905"
                ),
                expects: {
                  ...fireworksAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_schema",
                    "data_extraction",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle all supported parameters with fireworks provider", () =>
        runGatewayTest({
          model: "kimi-k2-0905/fireworks",
          request: {
            body: {
              messages: [
                { role: "user", content: "Test comprehensive parameters" },
              ],
              max_tokens: 1000,
              temperature: 0.8,
              stop: ["STOP"],
              response_format: { type: "text" },
            },
          },
          expected: {
            providers: [
              {
                url: "https://api.fireworks.ai/inference/v1/chat/completions",
                response: "success",
                model: "accounts/fireworks/models/kimi-k2-instruct-0905",
                data: createOpenAIMockResponse(
                  "accounts/fireworks/models/kimi-k2-instruct-0905"
                ),
                expects: {
                  ...fireworksAuthExpectations,
                  bodyContains: [
                    "max_tokens",
                    "temperature",
                    "stop",
                    "response_format",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });

  describe("Error scenarios - kimi-k2-0905 with Fireworks Provider", () => {
    it("should handle Fireworks provider failure", () =>
      runGatewayTest({
        model: "kimi-k2-0905/fireworks",
        expected: {
          providers: [
            {
              url: "https://api.fireworks.ai/inference/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Fireworks service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from Fireworks", () =>
      runGatewayTest({
        model: "kimi-k2-0905/fireworks",
        expected: {
          providers: [
            {
              url: "https://api.fireworks.ai/inference/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from Fireworks", () =>
      runGatewayTest({
        model: "kimi-k2-0905/fireworks",
        expected: {
          providers: [
            {
              url: "https://api.fireworks.ai/inference/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
            },
          ],
          finalStatus: 401,
        },
      }));

    it("should handle model not found error from Fireworks", () =>
      runGatewayTest({
        model: "kimi-k2-0905/fireworks",
        expected: {
          providers: [
            {
              url: "https://api.fireworks.ai/inference/v1/chat/completions",
              response: "failure",
              statusCode: 404,
              errorMessage: "Model not found",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle timeout from Fireworks", () =>
      runGatewayTest({
        model: "kimi-k2-0905/fireworks",
        expected: {
          providers: [
            {
              url: "https://api.fireworks.ai/inference/v1/chat/completions",
              response: "failure",
              statusCode: 408,
              errorMessage: "Request timeout",
            },
          ],
          finalStatus: 500,
        },
      }));
  });

  describe("Provider validation - kimi-k2-0905 with Fireworks", () => {
    it("should construct correct Fireworks URL for kimi-k2-0905", () =>
      runGatewayTest({
        model: "kimi-k2-0905/fireworks",
        expected: {
          providers: [
            {
              url: "https://api.fireworks.ai/inference/v1/chat/completions",
              response: "success",
              model: "accounts/fireworks/models/kimi-k2-instruct-0905",
              data: createOpenAIMockResponse(
                "accounts/fireworks/models/kimi-k2-instruct-0905"
              ),
              expects: fireworksAuthExpectations,
              customVerify: (call) => {
                // Verify that the URL is correctly constructed
                // Base URL: https://api.fireworks.ai/
                // Built URL: https://api.fireworks.ai/inference/v1/chat/completions
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for Fireworks", () =>
      runGatewayTest({
        model: "kimi-k2-0905/fireworks",
        expected: {
          providers: [
            {
              url: "https://api.fireworks.ai/inference/v1/chat/completions",
              response: "success",
              model: "accounts/fireworks/models/kimi-k2-instruct-0905", // Should map to the correct provider model ID
              data: createOpenAIMockResponse(
                "accounts/fireworks/models/kimi-k2-instruct-0905"
              ),
              expects: fireworksAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for Fireworks", () =>
      runGatewayTest({
        model: "kimi-k2-0905/fireworks",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://api.fireworks.ai/inference/v1/chat/completions",
              response: "success",
              model: "accounts/fireworks/models/kimi-k2-instruct-0905",
              data: createOpenAIMockResponse(
                "accounts/fireworks/models/kimi-k2-instruct-0905"
              ),
              expects: {
                ...fireworksAuthExpectations,
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });
















  describe("BYOK Tests - kimi-k2-thinking with Canopy Wave", () => {
    describe("kimi-k2-thinking", () => {
      it("should handle canopy wave provider", () =>
        runGatewayTest({
          model: "kimi-k2-thinking/canopywave",
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-thinking",
                data: createOpenAIMockResponse(
                  "moonshotai/kimi-k2-thinking"
                ),
                expects: canopywaveAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tool calls with canopy wave provider", () =>
        runGatewayTest({
          model: "kimi-k2-thinking/canopywave",
          request: {
            body: {
              messages: [{ role: "user", content: "What's the weather?" }],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "get_weather",
                    description: "Get current weather",
                    parameters: {
                      type: "object",
                      properties: {
                        location: { type: "string" },
                      },
                      required: ["location"],
                    },
                  },
                },
              ],
              tool_choice: "auto",
              temperature: 0.7,
              max_tokens: 1000,
            },
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-thinking",
                data: createOpenAIMockResponse(
                  "moonshotai/kimi-k2-thinking"
                ),
                expects: {
                  ...canopywaveAuthExpectations,
                  bodyContains: [
                    "tools",
                    "tool_choice",
                    "get_weather",
                    "temperature",
                    "max_tokens",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle response format with canopy wave provider", () =>
        runGatewayTest({
          model: "kimi-k2-thinking/canopywave",
          request: {
            body: {
              messages: [{ role: "user", content: "Generate JSON data" }],
              response_format: { type: "json_object" },
              temperature: 0.1,
            },
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-thinking",
                data: createOpenAIMockResponse(
                  "moonshotai/kimi-k2-thinking"
                ),
                expects: {
                  ...canopywaveAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_object",
                    "temperature",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle structured outputs with fireworks provider", () =>
        runGatewayTest({
          model: "kimi-k2-thinking/canopywave",
          request: {
            body: {
              messages: [{ role: "user", content: "Extract data" }],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "data_extraction",
                  schema: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      age: { type: "number" },
                    },
                    required: ["name", "age"],
                  },
                },
              },
            },
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-thinking",
                data: createOpenAIMockResponse(
                  "moonshotai/kimi-k2-thinking"
                ),
                expects: {
                  ...canopywaveAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_schema",
                    "data_extraction",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle all supported parameters with fireworks provider", () =>
        runGatewayTest({
          model: "kimi-k2-thinking/canopywave",
          request: {
            body: {
              messages: [
                { role: "user", content: "Test comprehensive parameters" },
              ],
              max_tokens: 1000,
              temperature: 0.8,
              stop: ["STOP"],
              response_format: { type: "text" },
            },
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "moonshotai/kimi-k2-thinking",
                data: createOpenAIMockResponse(
                  "moonshotai/kimi-k2-thinking"
                ),
                expects: {
                  ...canopywaveAuthExpectations,
                  bodyContains: [
                    "max_tokens",
                    "temperature",
                    "stop",
                    "response_format",
                  ],
                },
              },
            ],
            finalStatus: 200,
          },
        }));
    });
  });

  describe("Error scenarios - kimi-k2-thinking with Canopy Wave Provider", () => {
    it("should handle Canopy Wave provider failure", () =>
      runGatewayTest({
        model: "kimi-k2-0905/canopywave",
        expected: {
          providers: [
            {
              url: "https://inference.canopywave.io/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Canopy Wave service unavailable",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle rate limiting from Canopy Wave", () =>
      runGatewayTest({
        model: "kimi-k2-0905/canopywave",
        expected: {
          providers: [
            {
              url: "https://inference.canopywave.io/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded",
            },
          ],
          finalStatus: 429,
        },
      }));

    it("should handle authentication failure from Fireworks", () =>
      runGatewayTest({
        model: "kimi-k2-0905/canopywave",
        expected: {
          providers: [
            {
              url: "https://inference.canopywave.io/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key",
            },
          ],
          finalStatus: 401,
        },
      }));

    it("should handle model not found error from Canopy Wave", () =>
      runGatewayTest({
        model: "kimi-k2-0905/canopywave",
        expected: {
          providers: [
            {
              url: "https://inference.canopywave.io/v1/chat/completions",
              response: "failure",
              statusCode: 404,
              errorMessage: "Model not found",
            },
          ],
          finalStatus: 500,
        },
      }));

    it("should handle timeout from Canopy Wave", () =>
      runGatewayTest({
        model: "kimi-k2-0905/canopywave",
        expected: {
          providers: [
            {
              url: "https://inference.canopywave.io/v1/chat/completions",
              response: "failure",
              statusCode: 408,
              errorMessage: "Request timeout",
            },
          ],
          finalStatus: 500,
        },
      }));
  });

  describe("Provider validation - kimi-k2-thinking with Canopy Wave", () => {
    it("should construct correct Canopy Wave URL for kimi-k2-thinking", () =>
      runGatewayTest({
        model: "kimi-k2-thinking/canopywave",
        expected: {
          providers: [
            {
              url: "https://inference.canopywave.io/v1/chat/completions",
              response: "success",
              model: "moonshotai/kimi-k2-thinking",
              data: createOpenAIMockResponse(
                "moonshotai/kimi-k2-thinking"
              ),
              expects: canopywaveAuthExpectations,
              customVerify: (call) => {
                // Verify that the URL is correctly constructed
                // Base URL: https://inference.canopywave.io/v1
                // Built URL: https://inference.canopywave.io/v1/chat/completions
              },
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle provider model ID mapping correctly for Canopy Wave", () =>
      runGatewayTest({
        model: "kimi-k2-thinking/canopywave",
        expected: {
          providers: [
            {
              url: "https://inference.canopywave.io/v1/chat/completions",
              response: "success",
              model: "moonshotai/kimi-k2-thinking", // Should map to the correct provider model ID
              data: createOpenAIMockResponse(
                "moonshotai/kimi-k2-thinking"
              ),
              expects: canopywaveAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for Canopy Wave", () =>
      runGatewayTest({
        model: "kimi-k2-thinking/canopywave",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://inference.canopywave.io/v1/chat/completions",
              response: "success",
              model: "moonshotai/kimi-k2-thinking",
              data: createOpenAIMockResponse(
                "moonshotai/kimi-k2-thinking"
              ),
              expects: {
                ...canopywaveAuthExpectations,
              },
            },
          ],
          finalStatus: 200,
        },
      }));
  });
});
