import { describe, it, beforeEach, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";
import { createOpenAIMockResponse } from "../test-utils";

// Define auth expectations for Novita provider
const novitaAuthExpectations = {
  headers: {
    Authorization: /^Bearer /
  }
};

// Define auth expectations for Canopy Wave provider
const canopywaveAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

describe("Zai Registry Tests", () => {
  beforeEach(() => {
    // Clear all mocks between tests
    vi.clearAllMocks();
  });

  describe("BYOK Tests - glm-4.6", () => {
    describe("glm-4.6", () => {
      it("should handle novita provider", () =>
        runGatewayTest({
          model: "glm-4.6/novita",
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "zai-org/glm-4.6",
                data: createOpenAIMockResponse("zai-org/glm-4.6"),
                expects: novitaAuthExpectations
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle tool calls with novita provider", () =>
        runGatewayTest({
          model: "glm-4.6/novita",
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
                        location: { type: "string" }
                      },
                      required: ["location"]
                    }
                  }
                }
              ],
              tool_choice: "auto",
              temperature: 0.7,
              max_tokens: 1000
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "zai-org/glm-4.6",
                data: createOpenAIMockResponse("zai-org/glm-4.6"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "tools",
                    "tool_choice",
                    "get_weather",
                    "temperature",
                    "max_tokens"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle response format with novita provider", () =>
        runGatewayTest({
          model: "glm-4.6/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "Generate JSON data" }],
              response_format: { type: "json_object" },
              temperature: 0.1,
              frequency_penalty: 0.5,
              presence_penalty: 0.3
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "zai-org/glm-4.6",
                data: createOpenAIMockResponse("zai-org/glm-4.6"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_object",
                    "temperature",
                    "frequency_penalty",
                    "presence_penalty"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle structured outputs with novita provider", () =>
        runGatewayTest({
          model: "glm-4.6/novita",
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
                      age: { type: "number" }
                    },
                    required: ["name", "age"]
                  }
                }
              }
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "zai-org/glm-4.6",
                data: createOpenAIMockResponse("zai-org/glm-4.6"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: [
                    "response_format",
                    "json_schema",
                    "data_extraction"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle functions parameter with novita provider", () =>
        runGatewayTest({
          model: "glm-4.6/novita",
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
                      b: { type: "number" }
                    },
                    required: ["a", "b"]
                  }
                }
              ],
              function_call: "auto"
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "zai-org/glm-4.6",
                data: createOpenAIMockResponse("zai-org/glm-4.6"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: ["functions", "function_call", "calculate_sum"]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle reasoning parameter with novita provider", () =>
        runGatewayTest({
          model: "glm-4.6/novita",
          request: {
            body: {
              messages: [{ role: "user", content: "Solve this problem" }],
              reasoning: { type: "step_by_step" },
              temperature: 0.7
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "zai-org/glm-4.6",
                data: createOpenAIMockResponse("zai-org/glm-4.6"),
                expects: {
                  ...novitaAuthExpectations,
                  bodyContains: ["reasoning", "step_by_step", "temperature"]
                }
              }
            ],
            finalStatus: 200
          }
        }));

      it("should handle all supported parameters with novita provider", () =>
        runGatewayTest({
          model: "glm-4.6/novita",
          request: {
            body: {
              messages: [
                { role: "user", content: "Test comprehensive parameters" }
              ],
              max_tokens: 1000,
              temperature: 0.8,
              top_p: 0.95,
              stop: ["STOP"],
              frequency_penalty: 0.2,
              presence_penalty: 0.1,
              seed: 12345,
              top_k: 50,
              min_p: 0.05,
              repetition_penalty: 1.1,
              logit_bias: { "50256": -100 },
              response_format: { type: "text" }
            }
          },
          expected: {
            providers: [
              {
                url: "https://api.novita.ai/openai/v1/chat/completions",
                response: "success",
                model: "zai-org/glm-4.6",
                data: createOpenAIMockResponse("zai-org/glm-4.6"),
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
                    "top_k",
                    "min_p",
                    "repetition_penalty",
                    "logit_bias",
                    "response_format"
                  ]
                }
              }
            ],
            finalStatus: 200
          }
        }));
    });
  });

  describe("Error scenarios - glm-4.6 with Novita Provider", () => {
    it("should handle Novita provider failure", () =>
      runGatewayTest({
        model: "glm-4.6/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 500,
              errorMessage: "Novita service unavailable"
            }
          ],
          finalStatus: 500
        }
      }));

    it("should handle rate limiting from Novita", () =>
      runGatewayTest({
        model: "glm-4.6/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 429,
              errorMessage: "Rate limit exceeded"
            }
          ],
          finalStatus: 429
        }
      }));

    it("should handle authentication failure from Novita", () =>
      runGatewayTest({
        model: "glm-4.6/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 401,
              errorMessage: "Invalid API key"
            }
          ],
          finalStatus: 401
        }
      }));

    it("should handle model not found error from Novita", () =>
      runGatewayTest({
        model: "glm-4.6/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 404,
              errorMessage: "Model not found"
            }
          ],
          finalStatus: 500
        }
      }));

    it("should handle timeout from Novita", () =>
      runGatewayTest({
        model: "glm-4.6/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "failure",
              statusCode: 408,
              errorMessage: "Request timeout"
            }
          ],
          finalStatus: 500
        }
      }));
  });

  describe("Provider validation - glm-4.6 with Novita", () => {
    it("should construct correct Novita URL for glm-4.6", () =>
      runGatewayTest({
        model: "glm-4.6/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "zai-org/glm-4.6",
              data: createOpenAIMockResponse("zai-org/glm-4.6"),
              expects: novitaAuthExpectations,
              customVerify: (call) => {
                // Verify that the URL is correctly constructed
                // Base URL: https://api.novita.ai/openai/v1
                // Built URL: https://api.novita.ai/openai/v1/chat/completions
              }
            }
          ],
          finalStatus: 200
        }
      }));

    it("should handle provider model ID mapping correctly for Novita", () =>
      runGatewayTest({
        model: "glm-4.6/novita",
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "zai-org/glm-4.6", // Should map to the correct provider model ID
              data: createOpenAIMockResponse("zai-org/glm-4.6"),
              expects: novitaAuthExpectations
            }
          ],
          finalStatus: 200
        }
      }));

    it("should handle request body mapping for Novita", () =>
      runGatewayTest({
        model: "glm-4.6/novita",
        request: {
          bodyMapping: "NO_MAPPING"
        },
        expected: {
          providers: [
            {
              url: "https://api.novita.ai/openai/v1/chat/completions",
              response: "success",
              model: "zai-org/glm-4.6",
              data: createOpenAIMockResponse("zai-org/glm-4.6"),
              expects: {
                ...novitaAuthExpectations
              }
            }
          ],
          finalStatus: 200
        }
      }));
  });

  describe("BYOK Tests - glm-4.6 with Canopy Wave Provider", () => {
    describe("glm-4.6", () => {
      it("should handle canopy wave provider", () =>
        runGatewayTest({
          model: "glm-4.6/canopywave",
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "zai/glm-4.6",
                data: createOpenAIMockResponse("zai/glm-4.6"),
                expects: canopywaveAuthExpectations,
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle tool calls with canopy wave provider", () =>
        runGatewayTest({
          model: "glm-4.6/canopywave",
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
                model: "zai/glm-4.6",
                data: createOpenAIMockResponse("zai/glm-4.6"),
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
          model: "glm-4.6/canopywave",
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
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "zai/glm-4.6",
                data: createOpenAIMockResponse("zai/glm-4.6"),
                expects: {
                  ...canopywaveAuthExpectations,
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

      it("should handle structured outputs with canopy wave provider", () =>
        runGatewayTest({
          model: "glm-4.6/canopywave",
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
                model: "zai/glm-4.6",
                data: createOpenAIMockResponse("zai/glm-4.6"),
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

      it("should handle functions parameter with canopy wave provider", () =>
        runGatewayTest({
          model: "glm-4.6/canopywave",
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
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "zai/glm-4.6",
                data: createOpenAIMockResponse("zai/glm-4.6"),
                expects: {
                  ...canopywaveAuthExpectations,
                  bodyContains: ["functions", "function_call", "calculate_sum"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle reasoning parameter with canopy wave provider", () =>
        runGatewayTest({
          model: "glm-4.6/canopywave",
          request: {
            body: {
              messages: [{ role: "user", content: "Solve this problem" }],
              reasoning: { type: "step_by_step" },
              temperature: 0.7,
            },
          },
          expected: {
            providers: [
              {
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "zai/glm-4.6",
                data: createOpenAIMockResponse("zai/glm-4.6"),
                expects: {
                  ...canopywaveAuthExpectations,
                  bodyContains: ["reasoning", "step_by_step", "temperature"],
                },
              },
            ],
            finalStatus: 200,
          },
        }));

      it("should handle all supported parameters with canopy wave provider", () =>
        runGatewayTest({
          model: "glm-4.6/canopywave",
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
                url: "https://inference.canopywave.io/v1/chat/completions",
                response: "success",
                model: "zai/glm-4.6",
                data: createOpenAIMockResponse("zai/glm-4.6"),
                expects: {
                  ...canopywaveAuthExpectations,
                  bodyContains: [
                    "max_tokens",
                    "temperature",
                    "top_p",
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

  describe("Error scenarios - glm-4.6 with Canopy Wave Provider", () => {
    it("should handle Canopy Wave provider failure", () =>
      runGatewayTest({
        model: "glm-4.6/canopywave",
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
        model: "glm-4.6/canopywave",
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

    it("should handle authentication failure from Canopy Wave", () =>
      runGatewayTest({
        model: "glm-4.6/canopywave",
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
        model: "glm-4.6/canopywave",
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
        model: "glm-4.6/canopywave",
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

  describe("Provider validation - glm-4.6 with Canopy Wave", () => {
    it("should construct correct Canopy Wave URL for glm-4.6", () =>
      runGatewayTest({
        model: "glm-4.6/canopywave",
        expected: {
          providers: [
            {
              url: "https://inference.canopywave.io/v1/chat/completions",
              response: "success",
              model: "zai/glm-4.6",
              data: createOpenAIMockResponse("zai/glm-4.6"),
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
        model: "glm-4.6/canopywave",
        expected: {
          providers: [
            {
              url: "https://inference.canopywave.io/v1/chat/completions",
              response: "success",
              model: "zai/glm-4.6", // Should map to the correct provider model ID
              data: createOpenAIMockResponse("zai/glm-4.6"),
              expects: canopywaveAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));

    it("should handle request body mapping for Canopy Wave", () =>
      runGatewayTest({
        model: "glm-4.6/canopywave",
        request: {
          bodyMapping: "NO_MAPPING",
        },
        expected: {
          providers: [
            {
              url: "https://inference.canopywave.io/v1/chat/completions",
              response: "success",
              model: "zai/glm-4.6",
              data: createOpenAIMockResponse("zai/glm-4.6"),
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
