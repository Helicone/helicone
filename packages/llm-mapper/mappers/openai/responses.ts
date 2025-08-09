import { MapperBuilder } from "../../path-mapper/builder";
import { LlmSchema, Message, Response, LLMPreview } from "../../types";

const typeMap: Record<string, Message["_type"]> = {
  input_text: "message",
  input_image: "image",
  input_file: "file",
};

interface OpenAIResponseRequest {
  model: string;
  input:
    | string
    | Array<{
        role: "user" | "assistant" | "system" | "developer";
        content:
          | string
          | Array<{
              // list of text input
              text: string;
              type: "input_text";
            }>
          | Array<{
              // image input
              detail: "high" | "low" | "auto";
              type: "input_image";
              file_id?: string | undefined;
              image_url?: string | undefined;
            }>
          | Array<{
              // file input}
              type: "input_file";
              file_data?: string | undefined;
              file_id?: string | undefined;
              filename?: string | undefined;
            }>;
      }>;
  instructions?: string;
  max_output_tokens?: number;
  metadata?: Record<string, string>;
  parallel_tool_calls?: boolean;
  previous_response_id?: string;
  reasoning?: {
    effort?: "low" | "medium" | "high";
  };
  store?: boolean;
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  truncation?: "auto" | "disabled";
  user?: string;
  tools?: Array<{
    type: "function";
    function: {
      name: string;
      description: string;
      parameters: Record<string, any>; // JSON Schema
    };
  }>;
  tool_choice?:
    | "none"
    | "auto"
    | "required"
    | { type: string; function?: { type: "function"; name: string } };
  frequency_penalty?: number;
  presence_penalty?: number;
  logit_bias?: Record<string, number>;
  logprobs?: boolean;
  top_logprobs?: number;
  n?: number;
  response_format?: { type: string; json_schema?: any };
  seed?: number;
  service_tier?: string;
  stream_options?: any;
  // Deprecated parameters
  function_call?: string | { name: string };
  functions?: Array<any>;
}

/**
 * Generate a human-readable preview text for Requests API requests.
 * Mirrors the intent of getRequestText in chat.ts, but adapted to the
 * Responses API where the request payload uses `input` instead of `messages`.
 */
export const getRequestText = (requestBody: OpenAIResponseRequest): string => {
  try {
    const anyRequest = requestBody as any;
    const heliconeMessage = anyRequest?.heliconeMessage;
    if (heliconeMessage) {
      return typeof heliconeMessage === "string"
        ? heliconeMessage
        : JSON.stringify(heliconeMessage);
    }

    const input = requestBody?.input;
    if (!input) return "";

    // If the entire input is a string, return directly
    if (typeof input === "string") {
      return input;
    }

    if (Array.isArray(input) && input.length > 0) {
      const lastItem = input[input.length - 1];
      const content = (lastItem as any)?.content;

      // Content can be a string or an array of typed items
      if (typeof content === "string") {
        return content;
      }

      if (Array.isArray(content)) {
        // Prefer text content if available
        const textItems = content.filter(
          (c: any) => c?.type === "input_text" && typeof c?.text === "string",
        );
        if (textItems.length > 0) {
          return textItems.map((c: any) => c.text).join(" ");
        }

        // Next, indicate image/file content succinctly
        if (content.some((c: any) => c?.type === "input_image")) {
          return "[Image]";
        }
        if (content.some((c: any) => c?.type === "input_file")) {
          return "[File]";
        }

        // Fallback to JSON preview of the first item
        return JSON.stringify(content[0] ?? "");
      }

      return "";
    }

    return "";
  } catch (error) {
    console.error("Error parsing request text (Responses API):", error);
    return "error_parsing_request";
  }
};

/**
 * Generate a human-readable preview text for Responses API responses.
 * Similar to getResponseText in chat.ts, but tailored to `output` format.
 */
export const getResponseText = (
  responseBody: any,
  statusCode: number = 200,
): string => {
  try {
    if (statusCode === 0 || statusCode === null) {
      return "";
    }

    if (responseBody?.error) {
      // Prefer message if present; else stringify the error object
      return (
        responseBody.error?.message ?? JSON.stringify(responseBody.error)
      );
    }

    // Responses API returns an `output` array with message items
    if (Array.isArray(responseBody?.output)) {
      const firstMessage = responseBody.output.find(
        (item: any) => item?.type === "message",
      );
      const content = firstMessage?.content;
      if (Array.isArray(content)) {
        const textContent = content.find((c: any) => c?.type === "output_text");
        if (textContent?.text) {
          return textContent.text;
        }
      }
    }

    // A consolidated response from a streamed OpenAI /v1/responses call
    if (responseBody?.item?.content && Array.isArray(responseBody.item.content)) {
      const contentArray = responseBody.item.content;
      const textContent = contentArray.find(
        (c: any) => c?.type === "output_text",
      );
      if (textContent?.text) {
        return textContent.text;
      }
      const firstItemType = contentArray[0]?.type;
      if (typeof firstItemType === "string" && firstItemType) {
        return `[${firstItemType}]`;
      }
    }

    // Fallbacks
    if (typeof responseBody?.text === "string") {
      return responseBody.text;
    }

    return "";
  } catch (error) {
    console.error("Error parsing response text (Responses API):", error);
    return "error_parsing_response";
  }
};

const convertRequestInputToMessages = (
  input: OpenAIResponseRequest["input"]
): Message[] => {
  if (!input) return [];

  if (typeof input === "string") {
    return [
      {
        _type: "message",
        role: "user",
        type: "input_text",
        content: input,
        id: "req-msg-0",
      },
    ];
  }

  return input
    .map((msg, msgIdx) => {
      if (typeof msg.content === "string") {
        return {
          _type: "message",
          role: msg.role,
          type: "input_text",
          content: msg.content,
          id: `req-msg-${msgIdx}`,
        } as Message;
      } else if (Array.isArray(msg.content)) {
        const contentArray = msg.content.map((content, contentIdx) => {
          const baseResponse: Message = {
            _type: typeMap[content.type] || "message",
            role: msg.role,
            type: content.type,
            id: `req-msg-${msgIdx}-${contentIdx}`,
          };

          if (content.type === "input_text" && content.text) {
            baseResponse.content = content.text;
          } else if (content.type === "input_image") {
            baseResponse.detail = content.detail;
            baseResponse.image_url = content.image_url;
          } else if (content.type === "input_file") {
            baseResponse.file_data = content.file_data;
            baseResponse.file_id = content.file_id;
            baseResponse.filename = content.filename;
          }

          return baseResponse;
        });

        return {
          _type: "contentArray",
          role: msg.role,
          id: `req-msg-${msgIdx}`,
          contentArray,
        };
      }

      return null;
    })
    .filter(Boolean) as Message[];
};

const toExternalRequest = (
  responses: Message[]
): OpenAIResponseRequest["input"] => {
  if (!responses) return [];
  return responses.map(({ role, _type, content, contentArray }) => {
    const validRole =
      (role as "user" | "assistant" | "system" | "developer") || "user";
    if (_type === "contentArray" && contentArray) {
      const textContent = contentArray.filter(
        (c): c is Message & { _type: "message" } => c._type === "message"
      );
      const imageContent = contentArray.filter(
        (c): c is Message & { _type: "image" } => c._type === "image"
      );
      const fileContent = contentArray.filter(
        (c): c is Message & { _type: "file" } => c._type === "file"
      );

      if (textContent.length > 0) {
        return {
          role: validRole,
          content: textContent.map((c) => ({
            type: "input_text",
            text: c.content ?? "",
          })),
        };
      }
      if (imageContent.length > 0) {
        return {
          role: validRole,
          content: imageContent.map((c) => ({
            type: "input_image",
            detail: (c.detail ?? "auto") as "high" | "low" | "auto",
            image_url: c.image_url,
            file_id: c.file_id,
          })),
        };
      }
      if (fileContent.length > 0) {
        return {
          role: validRole,
          content: fileContent.map((c) => ({
            type: "input_file",
            file_data: c.content,
            file_id: c.file_id,
            filename: c.filename,
          })),
        };
      }
      return {
        role: validRole,
        content: "",
      };
    }
    return {
      role: validRole,
      content: content || "",
    };
  });
};

const convertTools = (
  tools?: OpenAIResponseRequest["tools"]
): LlmSchema["request"]["tools"] => {
  if (!tools) return [];
  return tools.map((tool) => ({
    type: "function",
    name: tool.function?.name,
    description: tool.function?.description,
    parameters: tool.function?.parameters,
  }));
};

const toExternalTools = (
  tools?: LlmSchema["request"]["tools"]
): OpenAIResponseRequest["tools"] => {
  if (!tools || !Array.isArray(tools)) return undefined;

  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool?.name,
      description: tool?.description,
      parameters: tool?.parameters || {},
    },
  }));
};

/**
 * Convert OpenAI tool_choice to internal format
 */
const convertToolChoice = (
  toolChoice?: OpenAIResponseRequest["tool_choice"]
): LlmSchema["request"]["tool_choice"] => {
  if (!toolChoice) return undefined;

  // Handle string values
  if (typeof toolChoice === "string") {
    if (toolChoice === "none" || toolChoice === "auto") {
      return { type: toolChoice };
    } else if (toolChoice === "required") {
      return { type: "any" };
    }
    return undefined;
  }

  // Handle object format
  if (typeof toolChoice === "object") {
    if (toolChoice.type === "function" && toolChoice.function?.name) {
      return {
        type: "tool",
        name: toolChoice.function.name,
      };
    }
  }

  return undefined;
};

/**
 * Convert internal tool_choice back to OpenAI format
 */
const toExternalToolChoice = (
  toolChoice?: LlmSchema["request"]["tool_choice"]
): OpenAIResponseRequest["tool_choice"] => {
  if (!toolChoice) return undefined;

  // Handle basic types
  if (toolChoice.type === "none" || toolChoice.type === "auto") {
    return toolChoice.type;
  }

  // Handle "any" type (maps to "required" in OpenAI)
  if (toolChoice.type === "any") {
    return "required";
  }

  // Handle "tool" type with name
  if (toolChoice.type === "tool" && toolChoice?.name) {
    return {
      type: "function",
      function: {
        type: "function",
        name: toolChoice.name,
      },
    };
  }

  // Default to "auto" if we can't map it properly
  return "auto";
};

function convertToReasoningEffort(reasoning?: OpenAIResponseRequest["reasoning"]): LlmSchema["request"]["reasoning_effort"] {
  if (!reasoning) return undefined;
  return reasoning.effort;
}

function convertFromReasoningEffort(reasoning_effort: LlmSchema["request"]["reasoning_effort"]): OpenAIResponseRequest["reasoning"] {
  if (!reasoning_effort) return undefined;
  return { effort: reasoning_effort };
}


export const openaiResponseMapper = new MapperBuilder<OpenAIResponseRequest>(
  "openai-response"
)
  .map("model", "model")
  .mapWithTransform(
    "input",
    "messages",
    convertRequestInputToMessages,
    toExternalRequest
  )
  .map("instructions", "instructions")
  .map("temperature", "temperature")
  .map("top_p", "top_p")
  .map("n", "n")
  .map("stream", "stream")
  .map("max_output_tokens", "max_tokens")
  .map("parallel_tool_calls", "parallel_tool_calls")
  .mapWithTransform("reasoning", "reasoning_effort", convertToReasoningEffort, convertFromReasoningEffort)
  .mapWithTransform("tools", "tools", convertTools, toExternalTools)
  .mapWithTransform(
    "tool_choice",
    "tool_choice",
    convertToolChoice,
    toExternalToolChoice
  )
  .map("frequency_penalty", "frequency_penalty")
  .map("presence_penalty", "presence_penalty")
  .map("seed", "seed")
  .build();

/**
 * Convert response to internal Message format
 */
const convertResponse = (responseBody: any): Message[] => {
  // Check for the 'output' array specific to the Responses API
  if (!responseBody || !Array.isArray(responseBody.output)) return [];

  const messages: Message[] = [];

  // Iterate through the output array
  responseBody.output.forEach((outputItem: any, index: number) => {
    // Look for items of type 'message'
    if (outputItem.type === "message" && outputItem.content) {
      let messageText = "";
      // The content is an array, find the 'output_text' item
      if (Array.isArray(outputItem.content)) {
        const textContent = outputItem.content.find(
          (c: any) => c.type === "output_text"
        );
        if (textContent && textContent.text) {
          messageText = textContent.text;
        }
      }

      messages.push({
        _type: "message",
        role: outputItem.role || "assistant", // Get role from the message item
        content: messageText,
        id: outputItem.id || `resp-msg-${index}`, // Use ID from the output item if available
      });
    }
  });

  return messages;
};

export const mapOpenAIResponse = ({
  request,
  response,
  model,
}: {
  request: OpenAIResponseRequest;
  response: any;
  statusCode?: number;
  model: string;
}): { schema: LlmSchema; preview: LLMPreview } => {
  // Map the request using our path mapper
  const mappedRequest = openaiResponseMapper.toInternal({
    ...request,
    model: model || request.model,
  });

  // Create the LlmSchema structure
  const schema: LlmSchema = {
    request: mappedRequest,
    response: null,
  };

  // Add response data if available
  if (response) {
    const messages = convertResponse(response);
    schema.response = {
      messages,
      model: model || response.model,
    };
  }

  return {
    schema,
    preview: {
      concatenatedMessages: (schema.request.messages ?? []).concat(
        schema.response?.messages || []
      ),
      request: getRequestText(request),
      response: getResponseText(response),
      fullRequestText: () => JSON.stringify(request),
      fullResponseText: () => JSON.stringify(response),
    },
  };
};