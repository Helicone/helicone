import { LlmSchema } from "../../types";
import { getContentType } from "../../utils/contentHelpers";
import { getFormattedMessageContent } from "../../utils/messageUtils";
import { MapperFn } from "../types";

// Helper function to check content type
const isImageContent = (content: any): boolean => {
  return (
    typeof content === "object" &&
    content !== null &&
    content.type === "image_url" &&
    content.image_url?.url
  );
};

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
  const hasNoContent = responseBody?.choices
    ? responseBody?.choices?.[0]?.message?.content === null ||
      responseBody?.choices?.[0]?.message?.content === undefined
    : true;
  if (statusCode === 0 || statusCode === null) {
    return "";
  }

  if ("error" in responseBody) {
    return responseBody.error.heliconeMessage;
  }

  try {
    // Handle pending response or network error scenarios upfront
    if (statusCode === 0 || statusCode === null) return ""; // Pending response
    if (![200, 201, -3].includes(statusCode)) {
      // Network error or other non-success statuses
      return responseBody?.error?.message || responseBody?.helicone_error || "";
    }

    // For successful responses
    if (responseBody?.error) {
      // Check for an error from OpenAI
      return responseBody.error.message || "";
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
      // If there's no content in the delta, check for tool calls
      if (choice?.delta?.tool_calls) {
        const toolCalls = choice.delta.tool_calls.map((tool: any) => {
          const args = JSON.parse(tool.function.arguments);

          return `${tool.function.name}(${JSON.stringify(args)})`;
        });
        return `${toolCalls.join("\n")}`;
      }
      // If there's no tool calls in delta, check message
      if (choice?.message?.tool_calls) {
        const toolCalls = choice.message.tool_calls.map((tool: any) => {
          const args = JSON.parse(tool.function.arguments);

          return `${tool.function.name}(${JSON.stringify(args)})`;
        });
        return `${toolCalls.join("\n")}`;
      }

      if (choice?.delta?.function_call) {
        return `Function Call: ${JSON.stringify(choice.delta.function_call)}`;
      }
      return ""; // Empty string for other cases in streaming
    }

    if (
      /^claude/.test(model) &&
      responseBody?.content?.[0].type === "tool_use"
    ) {
      // Check for tool_use in the content array
      if (Array.isArray(responseBody?.content)) {
        const toolUse = responseBody.content.find(
          (item: any) => item.type === "tool_use"
        );
        if (toolUse) {
          return `${toolUse.name}(${JSON.stringify(toolUse.input)})`;
        }

        // If no tool_use, find the text content
        const textContent = responseBody.content.find(
          (item: any) => item.type === "text"
        );
        if (textContent) {
          return textContent.text || "";
        }
      }
    }

    if (/^claude/.test(model) && responseBody?.content?.[0]?.text) {
      // Specific handling for Claude model
      return responseBody.content[0].text;
    }

    // Handle choices
    const firstChoice = responseBody?.choices?.[0];
    if (firstChoice) {
      if (hasNoContent) {
        // Logic for when there's no content
        const { message } = firstChoice;

        // Helper function to determine if there's a function call
        const hasFunctionCall = () => {
          if (message?.function_call) return true;
          if (Array.isArray(message?.tool_calls)) {
            return message.tool_calls.some(
              (tool: any) => tool.type === "function"
            );
          }
          return false;
        };

        // Helper function to check if message.text is an object
        const hasText = () =>
          typeof message?.text === "object" && message.text !== null;

        if (hasText()) {
          return JSON.stringify(message.text);
        } else if (hasFunctionCall()) {
          const tools = message.tool_calls;
          const functionTool = tools?.find(
            (tool: any) => tool.type === "function"
          )?.function;
          if (functionTool) {
            return `${functionTool.name}(${functionTool.arguments})`;
          } else {
            return JSON.stringify(message.function_call, null, 2);
          }
        } else {
          return JSON.stringify(message.function_call, null, 2);
        }
      } else {
        // When there's content available
        return firstChoice.message?.content || "";
      }
    }
    // Fallback for missing choices
    return "";
  } catch (error) {
    console.error("Error parsing response text:", error);
    return "error_parsing_response";
  }
};

const getRequestMessages = (request: any) => {
  return request.messages?.map((msg: any) => {
    // Handle array content
    if (Array.isArray(msg.content)) {
      const textContent = msg.content.find((item: any) => item.type === "text");
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

    // Default case - use existing content formatting
    return {
      content: getFormattedMessageContent(msg.content),
      role: msg.role,
      _type: getContentType(msg as any),
    };
  });
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
  } else {
    return {
      messages: response?.choices?.map((choice: any) => ({
        content: getFormattedMessageContent(choice?.message?.content ?? ""),
        role: choice?.message?.role ?? "",
        tool_calls: choice?.message?.function_call
          ? [
              {
                name: choice.message.function_call.name,
                arguments: JSON.parse(choice.message.function_call.arguments),
              },
            ]
          : choice?.message?.tool_calls?.map((tool: any) => ({
              name: tool?.function?.name ?? "",
              arguments: JSON.parse(tool?.function?.arguments ?? ""),
            })) ?? [],
        _type: getContentType(choice.message as any),
      })),
      model: response?.model,
    };
  }
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
