import { LlmSchema, Message, Tool } from "../../types";
import { getContentType } from "../../utils/contentHelpers";
import { getFormattedMessageContent } from "../../utils/messageUtils";
import { MapperFn } from "../types";
import {
  formatStreamingToolCalls,
  handleArrayContent,
  handleClaudeResponse,
  handleObjectContent,
  handleToolCalls,
  handleToolResponse,
  isImageContent,
} from "./chat_helpers";

const getRequestText = (requestBody: any): string => {
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

    const lastMessage = messages.at(-1);
    if (!lastMessage) return "";

    // Handle function calls in request messages
    if (lastMessage.function_call || lastMessage.tool_calls) {
      return formatStreamingToolCalls(
        lastMessage.tool_calls || [lastMessage.function_call]
      );
    }

    const lastMessageContent = lastMessage.content;

    if (Array.isArray(lastMessageContent)) {
      return handleArrayContent(lastMessageContent);
    }

    if (isImageContent(lastMessageContent)) {
      return "[Image]";
    }

    if (typeof lastMessageContent === "object" && lastMessageContent !== null) {
      return handleObjectContent(lastMessageContent);
    }

    if (typeof lastMessageContent === "string") {
      return lastMessageContent;
    }

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
): string => {
  if (statusCode === 0 || statusCode === null) {
    return "";
  }

  if ("error" in responseBody) {
    return responseBody.error.heliconeMessage;
  }

  try {
    if (![200, 201, -3].includes(statusCode)) {
      return responseBody?.error?.message || responseBody?.helicone_error || "";
    }

    if (
      responseBody?.object === "chat.completion.chunk" ||
      responseBody?.choices?.[0]?.delta?.tool_calls
    ) {
      const choice = responseBody.choices?.[0];
      if (choice?.delta?.content) {
        return choice.delta.content;
      }

      const toolCalls =
        choice?.delta?.tool_calls || choice?.message?.tool_calls;
      if (toolCalls) {
        return formatStreamingToolCalls(toolCalls);
      }

      if (choice?.delta?.function_call) {
        return `Function Call: ${JSON.stringify(choice.delta.function_call)}`;
      }
      return "";
    }

    if (/^claude/.test(model)) {
      const claudeResponse = handleClaudeResponse(responseBody);
      if (claudeResponse) return claudeResponse;
    }

    const firstChoice = responseBody?.choices?.[0];
    if (firstChoice?.message) {
      const { message } = firstChoice;
      const hasNoContent =
        message?.content === null || message?.content === undefined;

      if (hasNoContent) {
        if (message?.text && typeof message.text === "object") {
          return JSON.stringify(message.text);
        }

        if (message?.tool_calls || message?.function_call) {
          return formatStreamingToolCalls(
            message.tool_calls || [message.function_call]
          );
        }
      }
      return message.content || "";
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
      // Handle function calls first
      if (msg.function_call || msg.tool_calls) {
        const toolCallMsg = handleToolCalls(msg);
        return {
          ...toolCallMsg,
          content: toolCallMsg.content || "",
          _type: "functionCall",
        };
      }

      // Handle tool responses
      if (msg.role === "tool" || msg.role === "function") {
        const toolResponseMsg = handleToolResponse(msg);
        return {
          ...toolResponseMsg,
          content: toolResponseMsg.content || "",
          _type: "function",
          name: msg.name,
          tool_calls: [
            {
              name: msg.name,
              arguments: {
                query_result: msg.content,
              },
            },
          ],
        };
      }

      // Handle array content (e.g. text + image)
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
            content: textContent.text || "",
            image_url: imageContent.image_url.url,
          };
        }
      }

      // Handle single image content
      if (msg.content?.type === "image_url") {
        return {
          role: msg.role,
          _type: "image",
          content: msg.content.text || "",
          image_url: msg.content.image_url.url,
        };
      }

      // Handle regular messages
      return {
        content: getFormattedMessageContent(msg.content) || "",
        role: msg.role || "user",
        _type: getContentType(msg as any),
      };
    }) ?? []
  );
};

const getLLMSchemaResponse = (response: any) => {
  if ("error" in response) {
    return {
      error: {
        heliconeMessage:
          "heliconeMessage" in response.error
            ? response.error.heliconeMessage
            : JSON.stringify(response.error),
      },
    };
  }

  return {
    messages: response?.choices
      ?.map((choice: any) => {
        const message = choice?.message;
        if (!message) return null;

        // Handle function calls
        if (message.function_call || message.tool_calls) {
          const toolCallMsg = handleToolCalls(message);
          return {
            ...toolCallMsg,
            content: toolCallMsg.content || "",
            _type: "functionCall",
          };
        }

        // Handle function/tool responses
        if (message.role === "function" || message.role === "tool") {
          return {
            content: getFormattedMessageContent(message.content) || "",
            role: message.role,
            _type: "function",
            name: message.name,
            tool_calls: [
              {
                name: message.name,
                arguments: {
                  query_result: message.content,
                },
              },
            ],
          };
        }

        // Handle regular messages
        return {
          content: getFormattedMessageContent(message.content) || "",
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
    tools: request.tools?.map((tool: Tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    })),
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
