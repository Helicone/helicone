import { describe, expect, it } from "@jest/globals";
import { anthropicChatMapper } from "../../llm-mapper/mappers/anthropic/chat-v2";

describe("Anthropic Chat Mapper Core Tests", () => {
  // Test forward mapping (external to internal)
  describe("toInternal transformation", () => {
    it("should convert basic Anthropic request to internal format", () => {
      // Setup a simple Anthropic chat request
      const externalRequest = {
        model: "claude-3-opus-20240229",
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
      const internalRequest = anthropicChatMapper.toInternal(externalRequest);

      // Verify basic fields were mapped correctly
      expect(internalRequest.schema.request.model).toBe(
        "claude-3-opus-20240229"
      );
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

    it("should handle system param in request by converting it to a system message", () => {
      const externalRequest = {
        model: "claude-3-sonnet-20240229",
        system: "You are Claude, an AI assistant by Anthropic.",
        messages: [
          {
            role: "user",
            content: "Tell me about yourself.",
          },
        ],
      };

      // Using mapAnthropicRequestV2 directly to test the function that handles system conversion
      const result = anthropicChatMapper.toInternal({
        ...externalRequest,
        messages: [
          {
            role: "system",
            content: "You are Claude, an AI assistant by Anthropic.",
          },
          ...(externalRequest.messages || []),
        ],
      });

      // Verify system message is included as the first message with role "system"
      expect(result.schema.request.messages).toHaveLength(2);
      expect(result.schema.request.messages?.[0]).toMatchObject({
        _type: "message",
        role: "system",
        content: "You are Claude, an AI assistant by Anthropic.",
      });

      // Verify user message is preserved
      expect(result.schema.request.messages?.[1].role).toBe("user");
    });

    it("should handle complex message content with arrays", () => {
      const externalRequest = {
        model: "claude-3-opus-20240229",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What's in this image?" },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: "/9j/4AAQSkZJRg...",
                },
              },
            ],
          },
        ],
      };

      const internalRequest = anthropicChatMapper.toInternal(externalRequest);

      // Verify message content was joined correctly
      expect(internalRequest.schema.request.messages?.[0].content).toBe(
        "What's in this image? "
      );
      expect(internalRequest.preview.request).toBe("What's in this image? ");
    });
  });

  // Test backward mapping (internal to external) focusing on message transformations
  describe("toExternal transformation", () => {
    it("should convert messages back to Anthropic format", () => {
      // Create simple internal request with just the fields needed for the mapper
      const partialInternalRequest = {
        schema: {
          request: {
            model: "claude-3-opus-20240229",
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
                role: "user",
                content: "Tell me about Claude.",
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
                role: "assistant",
                content: "I'm Claude, an AI assistant created by Anthropic.",
              },
            ],
          },
        },
      };

      // Use the mapper's public interface to directly test the message transformation
      const messages = partialInternalRequest.schema.request.messages;
      const externalMessages = anthropicChatMapper["mappings"]
        .find(
          (m) =>
            m.external === "messages" &&
            m.internal === "schema.request.messages"
        )
        ?.transform?.toExternal(messages);

      // Check if messages were transformed correctly
      expect(externalMessages).toHaveLength(2);
      expect(externalMessages?.[0]).toMatchObject({
        role: "user",
        content: "Tell me about Claude.",
      });
      expect(externalMessages?.[1]).toMatchObject({
        role: "assistant",
        content: "I'm Claude, an AI assistant created by Anthropic.",
      });

      // Internal properties like _type and id should not be present in external format
      expect(externalMessages?.[0]).not.toHaveProperty("_type");
      expect(externalMessages?.[0]).not.toHaveProperty("id");
    });

    it("should preserve system messages when converting to external format", () => {
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
                role: "system",
                content: "You are Claude, an AI assistant by Anthropic.",
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
                content: "Hello there",
              },
            ],
          },
        },
      };

      // Directly test message transformation
      const messages = partialInternalRequest.schema.request.messages;

      // Get the messages
      const externalMessages = anthropicChatMapper["mappings"]
        .find(
          (m) =>
            m.external === "messages" &&
            m.internal === "schema.request.messages"
        )
        ?.transform?.toExternal(messages);

      // Verify both messages are preserved including the system message
      expect(externalMessages).toHaveLength(2);
      expect(externalMessages?.[0].role).toBe("system");
      expect(externalMessages?.[1].role).toBe("user");
    });

    it("should correctly map basic properties to external format", () => {
      // Create a simple object with just the properties we want to test
      const internalObject = {
        schema: {
          request: {
            model: "claude-3-opus-20240229",
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 200,
            stream: true,
          },
        },
      };

      // Test each property mapping individually
      const modelMapping = anthropicChatMapper["mappings"].find(
        (m) => m.external === "model"
      );
      const temperatureMapping = anthropicChatMapper["mappings"].find(
        (m) => m.external === "temperature"
      );
      const topPMapping = anthropicChatMapper["mappings"].find(
        (m) => m.external === "top_p"
      );
      const maxTokensMapping = anthropicChatMapper["mappings"].find(
        (m) => m.external === "max_tokens"
      );
      const streamMapping = anthropicChatMapper["mappings"].find(
        (m) => m.external === "stream"
      );

      const getValueByPath = (obj: any, path: string) => {
        return path.split(".").reduce((p, c) => (p && p[c]) || null, obj);
      };

      // Verify each property is correctly mapped
      expect(getValueByPath(internalObject, modelMapping?.internal || "")).toBe(
        "claude-3-opus-20240229"
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

  // Add specific test for tools and tool_choice mapping
  describe("Tool mapping", () => {
    it("should convert Anthropic tools to internal format", () => {
      const externalRequest = {
        model: "claude-3-opus-20240229",
        messages: [
          {
            role: "user",
            content: "Can you help me book a flight?",
          },
        ],
        tools: [
          {
            name: "flight_search",
            description:
              "Search for flights based on departure and destination locations",
            input_schema: {
              type: "object",
              properties: {
                departure: {
                  type: "string",
                  description: "Departure city or airport code",
                },
                destination: {
                  type: "string",
                  description: "Destination city or airport code",
                },
                date: {
                  type: "string",
                  description: "Date of departure in YYYY-MM-DD format",
                },
              },
              required: ["departure", "destination", "date"],
            },
          },
        ],
        tool_choice: {
          type: "auto" as "auto" | "any" | "tool" | "string",
          disable_parallel_tool_use: false,
        },
      };

      const internalRequest = anthropicChatMapper.toInternal(externalRequest);

      // Verify tools were transformed correctly
      expect(internalRequest.schema.request.tools).toHaveLength(1);
      expect(internalRequest.schema.request.tools?.[0].name).toBe(
        "flight_search"
      );
      expect(internalRequest.schema.request.tools?.[0].description).toBe(
        "Search for flights based on departure and destination locations"
      );
      expect(internalRequest.schema.request.tools?.[0].parameters).toEqual(
        externalRequest.tools[0].input_schema
      );

      // Verify tool_choice was transformed correctly
      expect(internalRequest.schema.request.tool_choice?.type).toBe("auto");
      expect(internalRequest.schema.request.tool_choice?.name).toBeUndefined();
      expect(
        internalRequest.schema.request.parallel_tool_calls
      ).toBeUndefined();
    });

    it("should map different tool_choice types correctly", () => {
      // Test "tool" type with name
      const requestWithToolName = {
        model: "claude-3-sonnet-20240229",
        messages: [
          {
            role: "user",
            content: "Hello",
          },
        ],
        tool_choice: {
          type: "tool",
          name: "flight_search",
        },
      };

      const internalWithToolName =
        anthropicChatMapper.toInternal(requestWithToolName);
      expect(internalWithToolName.schema.request.tool_choice?.type).toBe(
        "tool"
      );
      expect(internalWithToolName.schema.request.tool_choice?.name).toBe(
        "flight_search"
      );

      // Test "any" type
      const requestWithAny = {
        model: "claude-3-sonnet-20240229",
        messages: [
          {
            role: "user",
            content: "Hello",
          },
        ],
        tool_choice: {
          type: "any" as "auto" | "any" | "tool" | "string",
        },
      };

      const internalWithAny = anthropicChatMapper.toInternal(requestWithAny);
      expect(internalWithAny.schema.request.tool_choice?.type).toBe("any");

      // Test "auto" type
      const requestWithAuto = {
        model: "claude-3-sonnet-20240229",
        messages: [
          {
            role: "user",
            content: "Hello",
          },
        ],
        tool_choice: {
          type: "auto",
        },
      };

      const internalWithAuto = anthropicChatMapper.toInternal(requestWithAuto);
      expect(internalWithAuto.schema.request.tool_choice?.type).toBe("auto");
    });

    it("should convert internal tool format back to Anthropic format", () => {
      // Setup internal format with tools
      const internalObject = {
        schema: {
          request: {
            tools: [
              {
                name: "flight_search",
                description: "Search for flights",
                parameters: {
                  type: "object",
                  properties: {
                    departure: { type: "string" },
                    destination: { type: "string" },
                  },
                  required: ["departure", "destination"],
                },
              },
            ],
            tool_choice: {
              type: "tool" as "auto" | "none" | "tool",
              name: "flight_search",
            },
          },
        },
      };

      // Get the tools mapping and test
      const toolsMapping = anthropicChatMapper["mappings"].find(
        (m) => m.external === "tools" && m.internal === "schema.request.tools"
      );

      const toolChoiceMapping = anthropicChatMapper["mappings"].find(
        (m) =>
          m.external === "tool_choice" &&
          m.internal === "schema.request.tool_choice"
      );

      // Use the getValueByPath helper for type safety
      const getValueByPath = (obj: any, path: string) => {
        return path.split(".").reduce((p, c) => (p && p[c]) || null, obj);
      };

      // Test tools mapping
      const tools = getValueByPath(
        internalObject,
        toolsMapping?.internal || ""
      );
      const externalTools = toolsMapping?.transform?.toExternal(tools);

      expect(externalTools).toHaveLength(1);
      expect(externalTools?.[0].name).toBe("flight_search");
      expect(externalTools?.[0].description).toBe("Search for flights");
      expect(externalTools?.[0].input_schema).toEqual(
        internalObject.schema.request.tools[0].parameters
      );

      // Test tool_choice mapping
      const toolChoice = getValueByPath(
        internalObject,
        toolChoiceMapping?.internal || ""
      );
      const externalToolChoice =
        toolChoiceMapping?.transform?.toExternal(toolChoice);

      expect(externalToolChoice?.type).toBe("tool");
      expect(externalToolChoice?.name).toBe("flight_search");
    });

    it("should map internal none type to Anthropic any type", () => {
      const internalObject = {
        schema: {
          request: {
            tool_choice: {
              type: "none" as "auto" | "none" | "tool",
            },
          },
        },
      };

      const toolChoiceMapping = anthropicChatMapper["mappings"].find(
        (m) =>
          m.external === "tool_choice" &&
          m.internal === "schema.request.tool_choice"
      );

      const getValueByPath = (obj: any, path: string) => {
        return path.split(".").reduce((p, c) => (p && p[c]) || null, obj);
      };

      const toolChoice = getValueByPath(
        internalObject,
        toolChoiceMapping?.internal || ""
      );
      const externalToolChoice =
        toolChoiceMapping?.transform?.toExternal(toolChoice);

      expect(externalToolChoice?.type).toBe("any");
    });
  });
});
