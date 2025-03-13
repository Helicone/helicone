import { describe, expect, it } from "@jest/globals";
import {
  googleChatMapper,
  mapGeminiRequestV2,
} from "../../llm-mapper/mappers/gemini/chat-v2";

describe("Gemini Chat V2 Mapper Core Tests", () => {
  // Test forward mapping (external to internal)
  describe("toInternal transformation", () => {
    it("should convert basic Gemini request to internal format", () => {
      // Setup a simple Gemini chat request
      const externalRequest = {
        model: "gemini-1.5-pro",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Hello, how are you?",
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100,
          topP: 0.9,
        },
      };

      // Transform to internal format
      const internalRequest = googleChatMapper.toInternal(externalRequest);

      // Verify basic fields were mapped correctly
      expect(internalRequest.model).toBe("gemini-1.5-pro");
      expect(internalRequest.temperature).toBe(0.7);
      expect(internalRequest.max_tokens).toBe(100);
      expect(internalRequest.top_p).toBe(0.9);

      // Verify messages were transformed correctly
      expect(internalRequest.messages).toHaveLength(1);
      expect(internalRequest.messages?.[0]).toMatchObject({
        _type: "message",
        role: "user",
        content: "Hello, how are you?",
      });
    });

    it("should handle image content in messages", () => {
      const imageData = "iVBORw0KGgoAAAANS...=";
      const externalRequest = {
        model: "gemini-1.5-pro",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "What's in this image?",
              },
              {
                inlineData: {
                  data: imageData,
                },
              },
            ],
          },
        ],
      };

      const internalRequest = googleChatMapper.toInternal(externalRequest);

      // Verify image message was captured correctly
      expect(internalRequest.messages?.[0]).toMatchObject({
        _type: "image",
        role: "user",
        content: "What's in this image?",
        image_url: imageData,
      });
    });

    it("should handle function calling in response", () => {
      // Create a request with a user message and a response with a function call
      const externalRequest = {
        model: "gemini-1.5-pro",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "What's the weather in San Francisco?",
              },
            ],
          },
        ],
      };

      const response = {
        candidates: [
          {
            content: {
              parts: [
                {
                  functionCall: {
                    name: "get_weather",
                    args: {
                      location: "San Francisco",
                      unit: "celsius",
                    },
                  },
                },
              ],
              role: "model",
            },
          },
        ],
      };

      // Use the direct mapper function to test both request and response handling
      const result = mapGeminiRequestV2({
        request: externalRequest,
        response,
        statusCode: 200,
        model: "gemini-1.5-pro",
      });

      // Check function call was correctly mapped in the response
      expect(result.response?.messages?.[0]).toMatchObject({
        _type: "functionCall",
        role: "model",
        tool_calls: [
          {
            name: "get_weather",
            arguments: {
              location: "San Francisco",
              unit: "celsius",
            },
          },
        ],
      });
    });

    it("should extract request and response preview text", () => {
      const externalRequest = {
        model: "gemini-1.5-pro",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Hello, how are you?",
              },
            ],
          },
        ],
      };

      const response = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "I'm doing well, thank you for asking!",
                },
              ],
              role: "model",
            },
          },
        ],
      };

      // Use the direct mapper function
      const result = mapGeminiRequestV2({
        request: externalRequest,
        response,
        statusCode: 200,
        model: "gemini-1.5-pro",
      });

      // Verify request text was extracted correctly
      expect(result.request.messages?.[0].content).toBe("Hello, how are you?");

      // Verify response text was extracted correctly
      expect(result.response?.messages?.[0].content).toBe(
        "I'm doing well, thank you for asking!"
      );
    });

    it("should handle error responses", () => {
      const result = mapGeminiRequestV2({
        request: {
          contents: [
            {
              parts: [{ text: "Hello" }],
              role: "user",
            },
          ],
        },
        response: {
          error: {
            message: "Invalid request",
            code: 400,
          },
        },
        statusCode: 400,
        model: "gemini-1.5-pro",
      });

      expect(result.response?.error).toEqual({
        heliconeMessage: {
          message: "Invalid request",
          code: 400,
        },
      });
    });

    it("should extract model from modelVersion when model is unknown", () => {
      const result = mapGeminiRequestV2({
        request: {
          contents: [
            {
              parts: [
                {
                  text: "List 3 classic sci-fi movies from the 1980s.",
                },
              ],
              role: "user",
            },
          ],
        },
        response: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '{"movies":[{"title":"Blade Runner","year":1982,"director":"Ridley Scott"}]}',
                  },
                ],
                role: "model",
              },
            },
          ],
          modelVersion: "gemini-2.0-flash",
        },
        statusCode: 200,
        model: "unknown",
      });

      expect(result.request.model).toBe("gemini-2.0-flash");
      expect(result.response?.model).toBe("gemini-2.0-flash");
    });
  });

  // Test backward mapping (internal to external)
  describe("toExternal transformation", () => {
    it("should convert messages back to Gemini format", () => {
      // Create internal request
      const partialInternalRequest = {
        model: "gemini-1.5-pro",
        temperature: 0.5,
        max_tokens: 150,
        messages: [
          {
            _type: "message" as
              | "message"
              | "functionCall"
              | "function"
              | "image"
              | "autoInput"
              | "contentArray"
              | "audio",
            role: "user",
            content: "Tell me about quantum computing.",
          },
          {
            _type: "message" as
              | "message"
              | "functionCall"
              | "function"
              | "image"
              | "autoInput"
              | "contentArray"
              | "audio",
            role: "model",
            content:
              "Quantum computing is a type of computation that uses quantum mechanics.",
          },
        ],
      };

      // Use the mapper's interface to test the message transformation
      const messages = partialInternalRequest.messages;
      const externalContents = googleChatMapper["mappings"]
        .find((m) => m.external === "contents" && m.internal === "messages")
        ?.transform?.toExternal(messages);

      // Check if messages were transformed correctly
      expect(externalContents).toHaveLength(2);
      expect(externalContents?.[0]).toMatchObject({
        role: "user",
        parts: [
          {
            text: "Tell me about quantum computing.",
          },
        ],
      });
      expect(externalContents?.[1]).toMatchObject({
        role: "model",
        parts: [
          {
            text: "Quantum computing is a type of computation that uses quantum mechanics.",
          },
        ],
      });

      // Internal properties should not be present in external format
      expect(externalContents?.[0]).not.toHaveProperty("_type");
    });

    it("should handle image content when converting back to external format", () => {
      const imageData = "base64imagedata";
      const partialInternalRequest = {
        messages: [
          {
            _type: "image" as
              | "message"
              | "functionCall"
              | "function"
              | "image"
              | "autoInput"
              | "contentArray"
              | "audio",
            role: "user",
            content: "What's in this image?",
            image_url: imageData,
          },
        ],
      };

      // Test message transformation
      const messages = partialInternalRequest.messages;
      const externalContents = googleChatMapper["mappings"]
        .find((m) => m.external === "contents" && m.internal === "messages")
        ?.transform?.toExternal(messages);

      // Verify image part was included
      expect(externalContents?.[0].parts).toHaveLength(2);
      expect(externalContents?.[0].parts[0]).toMatchObject({
        text: "What's in this image?",
      });
      expect(externalContents?.[0].parts[1]).toMatchObject({
        inlineData: {
          data: imageData,
        },
      });
    });

    it("should handle function calling when converting back to external format", () => {
      const partialInternalRequest = {
        messages: [
          {
            _type: "functionCall" as
              | "message"
              | "functionCall"
              | "function"
              | "image"
              | "autoInput"
              | "contentArray"
              | "audio",
            role: "model",
            tool_calls: [
              {
                name: "get_weather",
                arguments: {
                  location: "San Francisco",
                  unit: "celsius",
                },
              },
            ],
          },
        ],
      };

      // Test transformation
      const messages = partialInternalRequest.messages;
      const externalContents = googleChatMapper["mappings"]
        .find((m) => m.external === "contents" && m.internal === "messages")
        ?.transform?.toExternal(messages);

      // Verify function call structure
      expect(externalContents?.[0]).toMatchObject({
        role: "model",
        parts: [
          {
            functionCall: {
              name: "get_weather",
              args: {
                location: "San Francisco",
                unit: "celsius",
              },
            },
          },
        ],
      });
    });

    it("should correctly map generation config properties", () => {
      // Create test values to transform
      const temperature = 0.7;
      const topP = 0.9;
      const maxTokens = 200;
      const candidateCount = 2;
      const stopSequences = ["END", "STOP"];

      // Find temperature transformation via the property name
      const temperatureMapping = googleChatMapper["mappings"].find(
        (m) => m.internal === "temperature"
      );

      // Extract and test each transformation individually
      expect(temperatureMapping?.transform).toBeDefined();
      if (temperatureMapping?.transform) {
        const result = temperatureMapping.transform.toExternal(temperature);
        expect(result).toEqual({ temperature: 0.7 });
      }

      // Test topP transformation
      const topPMapping = googleChatMapper["mappings"].find(
        (m) => m.internal === "top_p"
      );
      expect(topPMapping?.transform).toBeDefined();
      if (topPMapping?.transform) {
        const result = topPMapping.transform.toExternal(topP);
        expect(result).toEqual({ topP: 0.9 });
      }

      // Test maxTokens transformation
      const maxTokensMapping = googleChatMapper["mappings"].find(
        (m) => m.internal === "max_tokens"
      );
      expect(maxTokensMapping?.transform).toBeDefined();
      if (maxTokensMapping?.transform) {
        const result = maxTokensMapping.transform.toExternal(maxTokens);
        expect(result).toEqual({ maxOutputTokens: 200 });
      }

      // Test candidateCount transformation
      const candidateCountMapping = googleChatMapper["mappings"].find(
        (m) => m.internal === "n"
      );
      expect(candidateCountMapping?.transform).toBeDefined();
      if (candidateCountMapping?.transform) {
        const result =
          candidateCountMapping.transform.toExternal(candidateCount);
        expect(result).toEqual({ candidateCount: 2 });
      }

      // Test stopSequences transformation
      const stopSequencesMapping = googleChatMapper["mappings"].find(
        (m) => m.internal === "stop"
      );
      expect(stopSequencesMapping?.transform).toBeDefined();
      if (stopSequencesMapping?.transform) {
        const result = stopSequencesMapping.transform.toExternal(stopSequences);
        expect(result).toEqual({ stopSequences: ["END", "STOP"] });
      }
    });
  });
});
