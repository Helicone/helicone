import { LlmSchema, Message, FunctionCall } from "../../types";
import { getContentType } from "../../utils/contentHelpers";
import { getFormattedMessageContent } from "../../utils/messageUtils";
import { MapperFn } from "../types";

interface ToolCall {
  function: {
    name: string;
    arguments: string;
  };
  type: string;
  id: string;
}

// Helper function to check content type
const isImageContent = (content: any): boolean => {
  return (
    typeof content === "object" &&
    content !== null &&
    content.type === "image_url" &&
    content.image_url?.url
  );
};

const parseFunctionArguments = (
  args: string | undefined
): Record<string, any> => {
  try {
    return JSON.parse(args ?? "{}");
  } catch {
    return {};
  }
};

const mapToolCallToFunction = (tool: ToolCall): FunctionCall => ({
  name: tool.function?.name ?? "",
  arguments: parseFunctionArguments(tool.function?.arguments),
});

const getRequestText = (requestBody: any) => {
  try {
    const heliconeMessage = requestBody?.heliconeMessage;
    if (heliconeMessage) {
      return typeof heliconeMessage === "string"
        ? heliconeMessage
        : JSON.stringify(heliconeMessage);
    }

    const messages = requestBody?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return "";
    }

    const lastMessageContent = messages.at(-1)?.content;

    // Handle array content
    if (Array.isArray(lastMessageContent)) {
      // Try to find first text content
      const textContent = lastMessageContent.find(
        (item: any) => typeof item === "string" || item?.type === "text"
      );

      if (textContent) {
        return typeof textContent === "string" ? textContent : textContent.text;
      }

      // Check for image content
      const imageContent = lastMessageContent.find(isImageContent);
      if (imageContent) {
        return "[Image]";
      }

      // If no text or image found, stringify the array
      return JSON.stringify(lastMessageContent);
    }

    // Handle image content
    if (isImageContent(lastMessageContent)) {
      return "[Image]";
    }

    // Handle object content
    if (typeof lastMessageContent === "object" && lastMessageContent !== null) {
      if (lastMessageContent.transcript) {
        return lastMessageContent.transcript;
      }
      if (lastMessageContent.text) {
        return lastMessageContent.text;
      }
      return JSON.stringify(lastMessageContent);
    }

    // Handle string content
    if (typeof lastMessageContent === "string") {
      return lastMessageContent;
    }

    // Handle other types
    return JSON.stringify(lastMessageContent || "");
  } catch (error) {
    console.error("Error parsing request text:", error);
    return "error_parsing_request";
  }
};

export const getResponseText = (
  responseBody: any,
  statusCode: number = 200,
  model: string
) => {
  if (statusCode === 0 || statusCode === null) {
    return "";
  }

  if ("error" in responseBody) {
    return responseBody.error.heliconeMessage;
  }

  try {
    // Handle non-success statuses
    if (![200, 201, -3].includes(statusCode)) {
      return responseBody?.error?.message || responseBody?.helicone_error || "";
    }

    // Handle streaming response chunks
    if (
      responseBody?.object === "chat.completion.chunk" ||
      responseBody?.choices?.[0]?.delta?.tool_calls
    ) {
      const choice = responseBody.choices?.[0];
      if (choice?.delta?.content) {
        return choice.delta.content;
      }

      // Handle tool calls in delta or message
      const toolCalls =
        choice?.delta?.tool_calls || choice?.message?.tool_calls;
      if (toolCalls) {
        return toolCalls
          .map((tool: ToolCall) => {
            const args = parseFunctionArguments(tool.function.arguments);
            return `${tool.function.name}(${JSON.stringify(args)})`;
          })
          .join("\n");
      }

      if (choice?.delta?.function_call) {
        return `Function Call: ${JSON.stringify(choice.delta.function_call)}`;
      }
      return "";
    }

    // Handle Claude model responses
    if (/^claude/.test(model)) {
      if (responseBody?.content?.[0].type === "tool_use") {
        const toolUse = responseBody.content.find(
          (item: any) => item.type === "tool_use"
        );
        if (toolUse) {
          return `${toolUse.name}(${JSON.stringify(toolUse.input)})`;
        }
      }
      if (responseBody?.content?.[0]?.text) {
        return responseBody.content[0].text;
      }
    }

    // Handle regular choices
    const firstChoice = responseBody?.choices?.[0];
    if (firstChoice) {
      const { message } = firstChoice;
      const hasNoContent =
        message?.content === null || message?.content === undefined;

      if (hasNoContent) {
        if (message?.text && typeof message.text === "object") {
          return JSON.stringify(message.text);
        }

        if (message?.tool_calls || message?.function_call) {
          const tools = message.tool_calls;
          const functionTool = tools?.find(
            (tool: ToolCall) => tool.type === "function"
          )?.function;

          if (functionTool) {
            return `${functionTool.name}(${functionTool.arguments})`;
          }
          return JSON.stringify(message.function_call, null, 2);
        }
      }
      return firstChoice.message?.content || "";
    }
    return "";
  } catch (error) {
    console.error("Error parsing response text:", error);
    return "error_parsing_response";
  }
};

export const getRequestMessages = (request: any): Message[] => {
  return (
    request.messages?.map((msg: any) => {
      // Handle array content
      if (Array.isArray(msg.content)) {
        const textContent = msg.content.find(
          (item: any) => item.type === "text"
        );
        const imageContent = msg.content.find(
          (item: any) => item.type === "image_url"
        );

        if (textContent && imageContent) {
          return {
            role: msg.role,
            _type: "image",
            content: textContent.text,
            image_url: imageContent.image_url.url,
          };
        }
      }

      // Handle single image content
      if (msg.content?.type === "image_url") {
        return {
          role: msg.role,
          _type: "image",
          content: "[Image]",
          image_url: msg.content.image_url.url,
        };
      }

      // Handle tool calls
      if (msg.tool_calls) {
        return {
          content: "",
          role: msg.role,
          tool_calls: msg.tool_calls.map(mapToolCallToFunction),
          _type: "functionCall",
        };
      }

      // Handle tool responses
      if (msg.role === "tool") {
        return {
          content: getFormattedMessageContent(msg.content),
          role: msg.role,
          tool_call_id: msg.tool_call_id,
          _type: "message",
        };
      }

      // Default case - use existing content formatting
      return {
        content: getFormattedMessageContent(msg.content),
        role: msg.role,
        _type: getContentType(msg as any),
      };
    }) ?? []
  );
};

const getLLMSchemaResponse = (response: any) => {
  if ("error" in response) {
    if ("heliconeMessage" in response.error) {
      return {
        error: {
          heliconeMessage: response.error.heliconeMessage,
        },
      };
    } else {
      return {
        error: {
          heliconeMessage: JSON.stringify(response.error),
        },
      };
    }
  }

  return {
    messages: response?.choices
      ?.map((choice: any) => {
        const message = choice?.message;
        if (!message) return null;

        // Handle tool calls
        const hasFunctionCall = message.function_call || message.tool_calls;
        if (hasFunctionCall) {
          return {
            content: "",
            role: message.role ?? "assistant",
            tool_calls: message.function_call
              ? [
                  {
                    name: message.function_call.name,
                    arguments: parseFunctionArguments(
                      message.function_call.arguments
                    ),
                  },
                ]
              : message.tool_calls?.map(mapToolCallToFunction) ?? [],
            _type: "functionCall",
          };
        }

        // Handle regular messages
        return {
          content: getFormattedMessageContent(message.content ?? ""),
          role: message.role ?? "",
          _type: getContentType(message),
        };
      })
      .filter(Boolean),
    model: response?.model,
  };
};

export const mapOpenAIRequest: MapperFn<any, any> = ({
  request,
  response,
  statusCode = 200,
  model,
}) => {
  const requestToReturn: LlmSchema["request"] = {
    frequency_penalty: request.frequency_penalty,
    max_tokens: request.max_tokens,
    model: model || request.model,
    presence_penalty: request.presence_penalty,
    temperature: request.temperature,
    top_p: request.top_p,
    messages: getRequestMessages(request),
    tool_choice: request.tool_choice,
  };

  const llmSchema: LlmSchema = {
    request: requestToReturn,
    response: getLLMSchemaResponse(response),
  };

  return {
    schema: llmSchema,
    preview: {
      request: getRequestText(request),
      response: getResponseText(response, statusCode, model),
      concatenatedMessages:
        llmSchema.request.messages?.concat(
          llmSchema.response?.messages ?? []
        ) ?? [],
    },
  };
};
