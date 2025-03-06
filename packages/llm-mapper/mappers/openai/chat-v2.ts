import { MapperBuilder } from "../../path-mapper/builder";
import { LlmSchema, Message } from "../../types";

/**
 * Simplified interface for the OpenAI Chat request format
 */
interface OpenAIChatRequest {
  model?: string;
  messages?: Array<{
    role: string;
    content: string | Array<any>;
    name?: string;
  }>;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: Array<any>;
}

/**
 * Type for message in external format
 */
type ExternalMessage = {
  role: string;
  content: string | Array<any>;
  name?: string;
};

/**
 * Extract text from the request messages
 */
const getRequestText = (messages: ExternalMessage[]): string => {
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

  if (responseBody.choices && Array.isArray(responseBody.choices)) {
    const lastChoice = responseBody.choices[responseBody.choices.length - 1];

    if (lastChoice.message && lastChoice.message.content) {
      return lastChoice.message.content;
    }
  }

  return JSON.stringify(responseBody);
};

/**
 * Convert request messages to internal Message format
 */
const convertRequestMessages = (
  messages?: OpenAIChatRequest["messages"]
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
  if (!responseBody || !responseBody.choices) return [];

  const messages: Message[] = [];

  for (const choice of responseBody.choices) {
    if (choice.message) {
      messages.push({
        _type: "message",
        role: choice.message.role || "assistant",
        content: choice.message.content || "",
        id: `resp-msg-${choice.index || 0}`,
      });
    }
  }

  return messages;
};

/**
 * Convert internal messages back to OpenAI message format
 */
const toExternalMessages = (messages: Message[]): ExternalMessage[] => {
  if (!messages) return [];

  return messages.map(({ _type, id, ...rest }) => ({
    role: rest.role || "user",
    content: rest.content || "",
    name: rest.name,
  }));
};

/**
 * Build the simplified OpenAI Chat mapper with proper type safety
 */
export const openaiChatMapper = new MapperBuilder<OpenAIChatRequest>(
  "openai-chat-v2"
)
  // Map basic request parameters
  .map("model", "schema.request.model")

  .map("temperature", "schema.request.temperature")
  .map("top_p", "schema.request.top_p")
  .map("max_tokens", "schema.request.max_tokens")
  .map("stream", "schema.request.stream")

  // Map messages with transformation
  .mapWithTransform(
    "messages",
    "schema.request.messages",
    convertRequestMessages,
    toExternalMessages
  )

  // Map preview data
  .mapWithTransform(
    "messages",
    "preview.request",
    getRequestText,
    // Returning empty array when converting back to be type-safe
    (_: string) => [] as ExternalMessage[]
  )
  .buildAndRegister();

/**
 * Maps an OpenAI request to our internal format
 */
export const mapOpenAIRequestV2 = ({
  request,
  response,
  model,
}: {
  request: OpenAIChatRequest;
  response: any;
  statusCode?: number; // Not currently used
  model: string;
}): LlmSchema => {
  // Map the request using our path mapper
  const mappedRequest = openaiChatMapper.toInternal({
    ...request,
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
