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
      };

      // Transform to internal format
      const internalRequest = openaiChatMapper.toInternal(externalRequest);

      // Verify basic fields were mapped correctly
      expect(internalRequest.model).toBe("gpt-4");
      expect(internalRequest.temperature).toBe(0.7);

      // Verify messages were transformed correctly
      expect(internalRequest.messages).toHaveLength(1);
      expect(internalRequest.messages?.[0]).toMatchObject({
        _type: "message",
        role: "user",
        content: "Hello, how are you?",
        id: "req-msg-0",
      });
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
      expect(internalRequest.messages?.[0].content).toBe(
        "What's in this image? "
      );
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
        .find((m) => m.external === "messages" && m.internal === "messages")
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
        .find((m) => m.external === "messages" && m.internal === "messages")
        ?.transform?.toExternal(messages);

      // Verify name field was preserved
      expect(externalMessages?.[0].name).toBe("John");
    });

    it("should correctly map basic properties to external format", () => {
      // Create a simple object with just the properties we want to test
      const internalObject = {
        model: "gpt-4",
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 200,
        stream: true,
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
        getValueByPath(internalObject, streamMapping?.internal || "")
      ).toBe(true);
    });
  });

  // Test tool and tool_choice mapping
  describe("Tool and tool_choice mapping", () => {
    it("should properly convert OpenAI tools to internal format", () => {
      const externalRequest = {
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: "Find me a restaurant",
          },
        ],
        tools: [
          {
            type: "function" as const,
            function: {
              name: "find_restaurant",
              description: "Find restaurants by cuisine and location",
              parameters: {
                type: "object",
                properties: {
                  cuisine: {
                    type: "string",
                    description: "Type of cuisine",
                  },
                  location: {
                    type: "string",
                    description: "City or area",
                  },
                },
                required: ["cuisine", "location"],
              },
            },
          },
        ],
      };

      const internalRequest = openaiChatMapper.toInternal(externalRequest);

      // Verify tools were transformed correctly
      expect(internalRequest.tools).toHaveLength(1);
      const tool = internalRequest.tools?.[0];
      if (tool) {
        expect(tool.name).toBe("find_restaurant");
        expect(tool.description).toBe(
          "Find restaurants by cuisine and location"
        );
        expect(tool.parameters).toEqual(
          externalRequest.tools[0].function.parameters
        );
      }
    });

    it("should map different tool_choice types correctly", () => {
      // Test "none" string type
      const requestWithNone = {
        tool_choice: "none" as const,
      };
      const internalWithNone = openaiChatMapper.toInternal(requestWithNone);
      expect(internalWithNone.tool_choice?.type).toBe("none");
      expect(internalWithNone.tool_choice?.name).toBeUndefined();

      // Test "auto" string type
      const requestWithAuto = {
        tool_choice: "auto" as const,
      };
      const internalWithAuto = openaiChatMapper.toInternal(requestWithAuto);
      expect(internalWithAuto.tool_choice?.type).toBe("auto");
      expect(internalWithAuto.tool_choice?.name).toBeUndefined();

      // Test "required" string type (maps to "any")
      const requestWithRequired = {
        tool_choice: "required" as const,
      };
      const internalWithRequired =
        openaiChatMapper.toInternal(requestWithRequired);
      expect(internalWithRequired.tool_choice?.type).toBe("any");
      expect(internalWithRequired.tool_choice?.name).toBeUndefined();

      // Test function object type (maps to "tool")
      const requestWithFunction = {
        tool_choice: {
          type: "function" as const,
          function: {
            type: "function" as const,
            name: "find_restaurant",
          },
        },
      };
      const internalWithFunction =
        openaiChatMapper.toInternal(requestWithFunction);
      expect(internalWithFunction.tool_choice?.type).toBe("tool");
      expect(internalWithFunction.tool_choice?.name).toBe("find_restaurant");
    });

    it("should convert internal tool_choice format back to OpenAI format", () => {
      // Find tool_choice mapping in the openaiChatMapper
      const toolChoiceMapping = openaiChatMapper["mappings"].find(
        (m) => m.external === "tool_choice" && m.internal === "tool_choice"
      );

      // Helper to get value by path
      const getValueByPath = (obj: any, path: string) => {
        return path.split(".").reduce((p, c) => (p && p[c]) || null, obj);
      };

      // Test converting "none" type
      const internalNone = {
        tool_choice: {
          type: "none" as const,
        },
      };

      const toolChoiceNone = getValueByPath(
        internalNone,
        toolChoiceMapping?.internal || ""
      );

      const externalNone =
        toolChoiceMapping?.transform?.toExternal(toolChoiceNone);
      expect(externalNone).toBe("none");

      // Test converting "auto" type
      const internalAuto = {
        tool_choice: {
          type: "auto" as const,
        },
      };

      const toolChoiceAuto = getValueByPath(
        internalAuto,
        toolChoiceMapping?.internal || ""
      );

      const externalAuto =
        toolChoiceMapping?.transform?.toExternal(toolChoiceAuto);
      expect(externalAuto).toBe("auto");

      // Test converting "any" type (maps to "required")
      const internalAny = {
        tool_choice: {
          type: "any" as const,
        },
      };

      const toolChoiceAny = getValueByPath(
        internalAny,
        toolChoiceMapping?.internal || ""
      );

      const externalAny =
        toolChoiceMapping?.transform?.toExternal(toolChoiceAny);
      expect(externalAny).toBe("required");

      // Test converting "tool" type with name
      const internalTool = {
        tool_choice: {
          type: "tool" as const,
          name: "find_restaurant",
        },
      };

      const toolChoiceTool = getValueByPath(
        internalTool,
        toolChoiceMapping?.internal || ""
      );

      const externalTool =
        toolChoiceMapping?.transform?.toExternal(toolChoiceTool);
      expect(externalTool).toEqual({
        type: "function",
        function: {
          type: "function",
          name: "find_restaurant",
        },
      });
    });
  });
});
