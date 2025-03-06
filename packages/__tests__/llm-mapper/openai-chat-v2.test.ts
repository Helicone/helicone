import { describe, expect, it } from "@jest/globals";
import { openaiChatMapper } from "../../llm-mapper/mappers/openai/chat-v2";

describe("OpenAI Chat Mapper Core Tests", () => {
  // Test forward mapping (external to internal)
  describe("toInternal transformation", () => {
    it("should convert basic OpenAI request to internal format", () => {
      // Setup a simple OpenAI chat request
      const externalRequest = {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: "Hello, how are you?",
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      };

      // Transform to internal format
      const internalRequest = openaiChatMapper.toInternal(externalRequest);

      // Verify basic fields were mapped correctly
      expect(internalRequest.schema.request.model).toBe("gpt-4");
      expect(internalRequest.schema.request.temperature).toBe(0.7);
      expect(internalRequest.schema.request.max_tokens).toBe(100);

      // Verify messages were transformed correctly
      expect(internalRequest.schema.request.messages).toHaveLength(1);
      expect(internalRequest.schema.request.messages?.[0]).toMatchObject({
        _type: "message",
        role: "user",
        content: "Hello, how are you?",
        id: "req-msg-0",
      });

      // Verify preview was extracted correctly
      expect(internalRequest.preview.request).toBe("Hello, how are you?");
    });

    it("should handle complex message content with arrays", () => {
      const externalRequest = {
        model: "gpt-4-vision",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What's in this image?" },
              {
                type: "image_url",
                image_url: { url: "https://example.com/image.jpg" },
              },
            ],
          },
        ],
      };

      const internalRequest = openaiChatMapper.toInternal(externalRequest);

      // Verify message content was joined correctly
      expect(internalRequest.schema.request.messages?.[0].content).toBe(
        "What's in this image? "
      );
      expect(internalRequest.preview.request).toBe("What's in this image? ");
    });
  });

  // Test backward mapping (internal to external) focusing on message transformations
  describe("toExternal transformation", () => {
    it("should convert messages back to OpenAI format", () => {
      // Create simple internal request with just the fields needed for the mapper
      const partialInternalRequest = {
        schema: {
          request: {
            model: "gpt-4",
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
                id: "req-msg-0",
                role: "system",
                content: "You are a helpful assistant.",
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
                id: "req-msg-1",
                role: "user",
                content: "Tell me about TypeScript.",
              },
            ],
          },
        },
      };

      // Use the mapper's public interface to directly test the message transformation
      const messages = partialInternalRequest.schema.request.messages;
      const externalMessages = openaiChatMapper["mappings"]
        .find(
          (m) =>
            m.external === "messages" &&
            m.internal === "schema.request.messages"
        )
        ?.transform?.toExternal(messages);

      // Check if messages were transformed correctly
      expect(externalMessages).toHaveLength(2);
      expect(externalMessages?.[0]).toMatchObject({
        role: "system",
        content: "You are a helpful assistant.",
      });
      expect(externalMessages?.[1]).toMatchObject({
        role: "user",
        content: "Tell me about TypeScript.",
      });

      // Internal properties like _type and id should not be present in external format
      expect(externalMessages?.[0]).not.toHaveProperty("_type");
      expect(externalMessages?.[0]).not.toHaveProperty("id");
    });

    it("should preserve name field when converting messages back to external format", () => {
      const partialInternalRequest = {
        schema: {
          request: {
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
                id: "req-msg-0",
                role: "user",
                content: "Hello there",
                name: "John",
              },
            ],
          },
        },
      };

      // Directly test message transformation
      const messages = partialInternalRequest.schema.request.messages;
      const externalMessages = openaiChatMapper["mappings"]
        .find(
          (m) =>
            m.external === "messages" &&
            m.internal === "schema.request.messages"
        )
        ?.transform?.toExternal(messages);

      // Verify name field was preserved
      expect(externalMessages?.[0].name).toBe("John");
    });

    it("should correctly map basic properties to external format", () => {
      // Create a simple object with just the properties we want to test
      const internalObject = {
        schema: {
          request: {
            model: "gpt-4",
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 200,
            stream: true,
          },
        },
      };

      // Test each property mapping individually
      const modelMapping = openaiChatMapper["mappings"].find(
        (m) => m.external === "model"
      );
      const temperatureMapping = openaiChatMapper["mappings"].find(
        (m) => m.external === "temperature"
      );
      const topPMapping = openaiChatMapper["mappings"].find(
        (m) => m.external === "top_p"
      );
      const maxTokensMapping = openaiChatMapper["mappings"].find(
        (m) => m.external === "max_tokens"
      );
      const streamMapping = openaiChatMapper["mappings"].find(
        (m) => m.external === "stream"
      );

      // Get values using the mapper's internal getValueByPath method
      const getValueByPath = (obj: any, path: string) => {
        return openaiChatMapper["getValueByPath"](obj, path);
      };

      // Verify each property is correctly mapped
      expect(getValueByPath(internalObject, modelMapping?.internal || "")).toBe(
        "gpt-4"
      );
      expect(
        getValueByPath(internalObject, temperatureMapping?.internal || "")
      ).toBe(0.7);
      expect(getValueByPath(internalObject, topPMapping?.internal || "")).toBe(
        0.9
      );
      expect(
        getValueByPath(internalObject, maxTokensMapping?.internal || "")
      ).toBe(200);
      expect(
        getValueByPath(internalObject, streamMapping?.internal || "")
      ).toBe(true);
    });
  });
});
