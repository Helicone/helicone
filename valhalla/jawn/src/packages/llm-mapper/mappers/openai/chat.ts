import { LlmSchema } from "../../types";
import { getContentType } from "../../utils/contentHelpers";
import { getFormattedMessageContent } from "../../utils/messageUtils";
import { MapperFn } from "../types";

const getRequestText = (requestBody: any) => {
  try {
    const heliconeMessage = requestBody?.heliconeMessage;
    if (heliconeMessage) {
      return heliconeMessage;
    }

    const messages = requestBody?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return "";
    }

    const lastMessageContent = messages.at(-1)?.content;

    if (Array.isArray(lastMessageContent)) {
      const firstString = lastMessageContent.find(
        (item) => typeof item === "string"
      );
      if (firstString) return firstString;

      for (const message of [...messages].reverse()) {
        if (typeof message.content === "string") {
          return message.content;
        }

        let textContent = message.content?.find((c: any) => c.type === "text");

        if (!textContent) {
          textContent = message.content?.find(
            (c: any) => typeof c === "string"
          );
        }

        if (textContent && textContent.text) {
          return textContent.text;
        }
      }
      return "";
    } else if (
      typeof lastMessageContent === "object" &&
      lastMessageContent !== null
    ) {
      return lastMessageContent.transcript || "";
    }

    return typeof lastMessageContent === "string"
      ? lastMessageContent
      : JSON.stringify(lastMessageContent || "");
  } catch (error) {
    console.error("Error parsing request text:", error);
    return "error_parsing_request";
  }
};

const getResponseText = (
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
    if (responseBody?.object === "chat.completion.chunk") {
      const choice = responseBody.choices?.[0];
      if (choice?.delta?.content) {
        return choice.delta.content;
      }
      // If there's no content in the delta, it might be a function call or tool call
      if (choice?.delta?.function_call) {
        return `Function Call: ${JSON.stringify(choice.delta.function_call)}`;
      }
      if (choice?.delta?.tool_calls) {
        return `Tool Calls: ${JSON.stringify(choice.delta.tool_calls)}`;
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
  return (
    request.messages
      // Handle tool_result
      ?.map((msg: any) => {
        if (Array.isArray(msg.content)) {
          return {
            ...msg,
            content: msg.content.map((item: any) => {
              if (item.type === "tool_result") {
                return {
                  type: "text",
                  text: `tool_result(${item.content})`,
                };
              }
              return item;
            }),
          };
        }
        return msg;
      })
      ?.map((message: any) => ({
        content: getFormattedMessageContent(message.content),
        role: message.role,
        _type: getContentType(message as any),
      }))
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
    model: request.model,
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
