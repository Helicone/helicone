import { MapperBuilder } from "@/llm-mapper/path-mapper/builder";
import { LlmSchema, Response, Message } from "@/llm-mapper/types";

const typeMap: Record<string, Response["_type"]> = {
  input_text: "text",
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

const convertRequestInputToMessages = (
  input: OpenAIResponseRequest["input"]
): Response[] => {
  if (!input) return [];

  if (typeof input === "string") {
    return [
      {
        _type: "text",
        role: "user",
        type: "input_text",
        text: input,
        id: "req-msg-0",
      },
    ];
  }

  return input
    .map((msg, msgIdx) => {
      if (typeof msg.content === "string") {
        return {
          _type: "text",
          role: msg.role,
          type: "input_text",
          text: msg.content,
          id: `req-msg-${msgIdx}`,
        };
      } else if (Array.isArray(msg.content)) {
        const contentArray = msg.content.map((content, contentIdx) => {
          const baseResponse: Response = {
            _type: typeMap[content.type] || "text",
            role: msg.role,
            type: content.type,
            id: `req-msg-${msgIdx}-${contentIdx}`,
          };

          if (content.type === "input_text" && content.text) {
            baseResponse.text = content.text;
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
    .filter(Boolean) as Response[];
};

const toExternalRequest = (
  responses: Response[]
): OpenAIResponseRequest["input"] => {
  if (!responses) return [];
  return responses.map(({ role, _type, text, contentArray }) => {
    if (_type === "contentArray" && contentArray) {
      const textContent = contentArray.filter(
        (c): c is Response & { _type: "text" } => c._type === "text"
      );
      const imageContent = contentArray.filter(
        (c): c is Response & { _type: "image" } => c._type === "image"
      );
      const fileContent = contentArray.filter(
        (c): c is Response & { _type: "file" } => c._type === "file"
      );

      if (textContent.length > 0) {
        return {
          role,
          content: textContent.map((c) => ({
            type: "input_text",
            text: c.text ?? "",
          })),
        };
      }
      if (imageContent.length > 0) {
        return {
          role,
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
          role,
          content: fileContent.map((c) => ({
            type: "input_file",
            file_data: c.file_data,
            file_id: c.file_id,
            filename: c.filename,
          })),
        };
      }
      return {
        role,
        content: "",
      };
    }
    return {
      role,
      content: text || "",
    };
  });
};

const convertTools = (
  tools?: OpenAIResponseRequest["tools"]
): LlmSchema["request"]["tools"] => {
  if (!tools) return [];
  return tools.map((tool) => ({
    type: "function",
    name: tool.function.name,
    description: tool.function.description,
    parameters: tool.function.parameters,
  }));
};

const toExternalTools = (
  tools?: LlmSchema["request"]["tools"]
): OpenAIResponseRequest["tools"] => {
  if (!tools || !Array.isArray(tools)) return undefined;

  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters || {},
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
  if (toolChoice.type === "tool" && toolChoice.name) {
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
  .map("temperature", "temperature")
  .map("top_p", "top_p")
  .map("n", "n")
  .map("stream", "stream")
  .map("max_output_tokens", "max_tokens")
  .map("parallel_tool_calls", "parallel_tool_calls")
  .map("reasoning", "reasoning_effort")
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
const convertResponse = (responseBody: any): Response[] => {
  if (!responseBody || !responseBody.choices) return [];

  const responses: Response[] = [];

  for (const choice of responseBody.choices) {
    if (choice.message) {
      responses.push({
        _type: "text",
        role: choice.response.role || "assistant",
        text: choice.response.text || "",
        type: choice.response.type,
        id: `resp-res-${choice.index || 0}`,
      });
    }
  }

  return responses;
};

export const mapOpenAIRequestV2 = ({
  request,
  response,
  model,
}: {
  request: OpenAIResponseRequest;
  response: any;
  statusCode?: number; // Not currently used
  model: string;
}): LlmSchema => {
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
    const responses = convertResponse(response);

    schema.response = {
      responses: responses,
      model: model || response.model,
    };
  }

  return schema;
};
