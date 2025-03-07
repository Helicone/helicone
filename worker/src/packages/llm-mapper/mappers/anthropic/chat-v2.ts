import { MapperBuilder } from "../../path-mapper/builder";
import { LlmSchema, Message } from "../../types";

/**
 * Simplified interface for the Anthropic Chat request format
 */
interface AnthropicChatRequest {
  model?: string;
  messages?: {
    role: string;
    content: string | Array<any>;
  }[];
  system?: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  stop_sequences?: string[];
  tools?: {
    name: string;
    description: string;
    input_schema: Record<string, any>;
  }[];
  tool_choice?: {
    type: "auto" | "any" | "tool" | string; // string is for tool name
    // For "auto", "any" and "tool"
    disable_parallel_tool_use?: boolean;
    // For "tool"
    name?: string;
  };
  thinking?: {
    type: "enabled";
    budget_tokens: number;
  };
}

/**
 * Extract text from the request messages
 */
const getRequestText = (messages: AnthropicChatRequest["messages"]): string => {
  if (!Array.isArray(messages) || messages.length === 0) return "";

  const lastMessage = messages.at(-1);
  if (!lastMessage) return "";

  if (typeof lastMessage.content === "string") {
    return lastMessage.content;
  } else if (Array.isArray(lastMessage.content)) {
    return lastMessage.content
      .map((c: any) =>
        typeof c === "string" ? c : c.type === "text" ? c.text : ""
      )
      .join(" ");
  }

  return JSON.stringify(lastMessage);
};

/**
 * Extract text from the response
 */
const getResponseText = (responseBody: any): string => {
  if (!responseBody) return "";

  if (responseBody.content && Array.isArray(responseBody.content)) {
    return responseBody.content
      .map((c: any) => (c.type === "text" ? c.text : ""))
      .join(" ")
      .trim();
  }

  return JSON.stringify(responseBody);
};

/**
 * Converts system parameter to a system message and appends other messages
 */
const processMessages = (
  messages: AnthropicChatRequest["messages"] = [],
  system?: string
): AnthropicChatRequest["messages"] => {
  const result: AnthropicChatRequest["messages"] = [];

  // Add system message if provided
  if (system) {
    result.push({
      role: "system",
      content: system,
    });
  }

  // Add all other messages
  if (Array.isArray(messages)) {
    // Filter out any existing system messages to avoid duplicates
    const nonSystemMessages = messages.filter((msg) => msg.role !== "system");
    result.push(...nonSystemMessages);
  }

  return result;
};

/**
 * Convert request messages to internal Message format
 */
const convertRequestMessages = (
  messages?: AnthropicChatRequest["messages"]
): Message[] => {
  if (!Array.isArray(messages) || messages.length === 0) return [];

  return messages.map((msg, idx): Message => {
    return {
      _type: "message",
      role: msg.role,
      content:
        typeof msg.content === "string"
          ? msg.content
          : Array.isArray(msg.content)
          ? msg.content
              .map((c: any) =>
                typeof c === "string" ? c : c.type === "text" ? c.text : ""
              )
              .join(" ")
          : "",
      id: `req-msg-${idx}`,
    };
  });
};

/**
 * Convert response to internal Message format
 */
const convertResponseMessages = (responseBody: any): Message[] => {
  if (!responseBody || !responseBody.content) return [];

  return [
    {
      _type: "message",
      role: "assistant",
      content: Array.isArray(responseBody.content)
        ? responseBody.content
            .map((c: any) => (c.type === "text" ? c.text : ""))
            .join(" ")
            .trim()
        : responseBody.content || "",
      id: "resp-msg-0",
    },
  ];
};

/**
 * Convert internal messages back to Anthropic message format
 */
const toExternalMessages = (
  messages: Message[]
): AnthropicChatRequest["messages"] => {
  if (!messages) return [];

  return messages.map(({ _type, id, ...rest }) => ({
    role: rest.role || "user",
    content: rest.content || "",
  }));
};

/**
 * Extract system message from messages array
 */
const extractSystemMessage = (
  messages: Message[]
): {
  systemMessage?: string;
  otherMessages: Message[];
} => {
  if (!messages || messages.length === 0) {
    return { otherMessages: [] };
  }

  const systemMessages = messages.filter((msg) => msg.role === "system");
  const otherMessages = messages.filter((msg) => msg.role !== "system");

  return {
    systemMessage:
      systemMessages.length > 0 ? systemMessages[0].content : undefined,
    otherMessages,
  };
};

/**
 * Convert Anthropic tools to internal Tool format
 */
const convertTools = (
  tools?: AnthropicChatRequest["tools"]
): LlmSchema["request"]["tools"] => {
  if (!tools || !Array.isArray(tools)) return undefined;

  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.input_schema,
  }));
};

/**
 * Convert internal Tool format back to Anthropic tools
 */
const toExternalTools = (
  tools?: LlmSchema["request"]["tools"]
): AnthropicChatRequest["tools"] => {
  if (!tools || !Array.isArray(tools)) return undefined;

  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters || {},
  }));
};

/**
 * Convert Anthropic tool_choice to internal format
 */
const convertToolChoice = (
  toolChoice?: AnthropicChatRequest["tool_choice"]
): LlmSchema["request"]["tool_choice"] => {
  if (!toolChoice) return undefined;

  // Map Anthropic "auto", "any", "tool" types to our universal format
  if (toolChoice.type === "auto" || toolChoice.type === "tool") {
    return {
      type: toolChoice.type,
      name: toolChoice.type === "tool" ? toolChoice.name : undefined,
    };
  }

  // Map Anthropic "any" to our "any"
  if (toolChoice.type === "any") {
    return {
      type: "any",
    };
  }

  // Handle string type (not one of the enum values) as tool name
  if (typeof toolChoice.type === "string") {
    return {
      type: "tool",
      name: toolChoice.type,
    };
  }

  // Default mapping for unknown types
  return {
    type: "auto",
  };
};

/**
 * Convert internal tool_choice back to Anthropic format
 */
const toExternalToolChoice = (
  toolChoice?: LlmSchema["request"]["tool_choice"]
): AnthropicChatRequest["tool_choice"] => {
  if (!toolChoice) return undefined;

  // Map universal "none" type to Anthropic "any"
  if (toolChoice.type === "none") {
    return {
      type: "any",
    };
  }

  // Direct mapping for "auto", "any" types
  if (toolChoice.type === "auto" || toolChoice.type === "any") {
    return {
      type: toolChoice.type,
    };
  }

  // Map universal "tool" type with name
  if (toolChoice.type === "tool" && toolChoice.name) {
    return {
      type: "tool",
      name: toolChoice.name,
    };
  }

  // Default to "auto" if we can't map it properly
  return {
    type: "auto",
  };
};

/**
 * Build the simplified Anthropic Chat mapper with proper type safety
 */
export const anthropicChatMapper = new MapperBuilder<AnthropicChatRequest>(
  "anthropic-chat-v2"
)
  // Map basic request parameters
  .map("model", "schema.request.model")
  .map("temperature", "schema.request.temperature")
  .map("top_p", "schema.request.top_p")
  .map("max_tokens", "schema.request.max_tokens")
  .map("stream", "schema.request.stream")
  .map("stop_sequences", "schema.request.stop")

  // Map tool-related parameters with transformations
  .mapWithTransform(
    "tools",
    "schema.request.tools",
    convertTools,
    toExternalTools
  )
  .mapWithTransform(
    "tool_choice",
    "schema.request.tool_choice",
    convertToolChoice,
    toExternalToolChoice
  )
  .mapWithTransform(
    "tool_choice",
    "schema.request.parallel_tool_calls",
    (toolChoice?: AnthropicChatRequest["tool_choice"]) => {
      if (!toolChoice || typeof toolChoice === "string") return undefined;
      return toolChoice.disable_parallel_tool_use === true ? false : undefined;
    },
    (_: boolean | null | undefined) => undefined
  )

  // Map messages with transformation
  .mapWithTransform(
    "messages",
    "schema.request.messages",
    (messagesInput: AnthropicChatRequest["messages"]) => {
      // Since we can't access the full request object in this transform function,
      // we'll need to look for a system message within the messages array
      return convertRequestMessages(messagesInput);
    },
    toExternalMessages
  )

  // Map preview data
  .mapWithTransform(
    "messages",
    "preview.request",
    getRequestText,
    // Returning empty array when converting back to be type-safe
    (_: string) => [] as AnthropicChatRequest["messages"]
  )
  .buildAndRegister();

/**
 * Maps an Anthropic request to our internal format
 */
export const mapAnthropicRequestV2 = ({
  request,
  response,
  model,
}: {
  request: AnthropicChatRequest;
  response: any;
  statusCode?: number; // Not currently used
  model: string;
}): LlmSchema => {
  // Process the request to transform system param into a system message
  const requestToMap = { ...request };

  // Process messages to include the system parameter as a system message
  if (
    requestToMap.system ||
    (requestToMap.messages &&
      requestToMap.messages.some((msg) => msg.role === "system"))
  ) {
    requestToMap.messages = processMessages(
      requestToMap.messages,
      requestToMap.system
    );
    // Remove the system parameter after processing to avoid duplication
    delete requestToMap.system;
  }

  // Map the request using our path mapper
  const mappedRequest = anthropicChatMapper.toInternal({
    ...requestToMap,
    model: model || request.model,
  });

  // Add response data
  if (response) {
    const responseMessages = convertResponseMessages(response);

    mappedRequest.schema.response = {
      messages: responseMessages,
      model: model || response.model,
    };

    mappedRequest.preview.response = getResponseText(response);
    mappedRequest.preview.concatenatedMessages = [
      ...(mappedRequest.schema.request.messages || []),
      ...responseMessages,
    ];
  }

  return mappedRequest.schema;
};
