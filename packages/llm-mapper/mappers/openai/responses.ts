import { MapperBuilder } from "@/llm-mapper/path-mapper/builder";
import { Response } from "@/llm-mapper/types";

const typeMap: Record<string, Response["_type"]> = {
  input_text: "text",
  input_image: "image",
  input_file: "file",
};

// Corrected: keyof typeof typeMap is the valid way to reference its keys
const typeReverseMap: Record<Response["_type"], keyof typeof typeMap> = {
  text: "input_text",
  image: "input_image",
  file: "input_file",
  functionCall: "input_text", // Defaulting function-related types to text
  function: "input_text",
  contentArray: "input_text", // This is handled separately
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
  if (!responses || responses.length === 0) return [];

  return responses.map(({ role, _type, text, contentArray, name }) => {
    // Handle contentArray case
    if (_type === "contentArray" && contentArray) {
      type InputTextItem = { type: "input_text"; text: string };
      type InputImageItem = {
        type: "input_image";
        detail: "high" | "low" | "auto";
        file_id?: string;
        image_url?: string;
      };
      type InputFileItem = {
        type: "input_file";
        file_data?: string;
        file_id?: string;
        filename?: string;
      };

      // Create properly typed content based on the type
      const textItems: InputTextItem[] = [];
      const imageItems: InputImageItem[] = [];
      const fileItems: InputFileItem[] = [];

      contentArray.forEach((content) => {
        if (content._type === "text") {
          textItems.push({
            type: "input_text",
            text: content.text ?? "",
          });
        } else if (content._type === "image") {
          imageItems.push({
            type: "input_image",
            detail: (content.detail || "auto") as "high" | "low" | "auto",
            ...(content.image_url ? { image_url: content.image_url } : {}),
            ...(content.file_id ? { file_id: content.file_id } : {}),
          });
        } else if (content._type === "file") {
          fileItems.push({
            type: "input_file",
            ...(content.file_data ? { file_data: content.file_data } : {}),
            ...(content.file_id ? { file_id: content.file_id } : {}),
            ...(content.filename ? { filename: content.filename } : {}),
          });
        }
      });

      // Based on what we have, return the appropriate content type
      if (textItems.length > 0) {
        return {
          role,
          ...(name ? { name } : {}),
          content: textItems,
        };
      } else if (imageItems.length > 0) {
        return {
          role,
          ...(name ? { name } : {}),
          content: imageItems,
        };
      } else if (fileItems.length > 0) {
        return {
          role,
          ...(name ? { name } : {}),
          content: fileItems,
        };
      }

      // Fallback for empty contentArray - use an empty text item
      return {
        role,
        ...(name ? { name } : {}),
        content: [
          {
            type: "input_text",
            text: "",
          },
        ],
      };
    }

    // Handle non-'contentArray' case - for simple text
    return {
      role,
      ...(name ? { name } : {}),
      content: text || "",
    };
  });
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
  .map("stream", "stream");
