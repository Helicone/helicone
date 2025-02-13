import { LlmSchema, Message } from "../../types";
import { getContentType } from "../../utils/contentHelpers";
import { MapperFn } from "../types";

const randomId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

type AnthropicContent = {
  type: string;
  text?: string;
  name?: string;
  input?: any;
  id?: string;
};

const getRequestText = (requestBody: any) => {
  const result = requestBody.tooLarge
    ? "Helicone Message: Input too large"
    : requestBody.prompt || requestBody.messages?.slice(-1)?.[0]?.content || "";

  if (typeof result === "string") {
    return result;
  }
  if (Array.isArray(result)) {
    return result.map((item) => item.text || JSON.stringify(item)).join(" ");
  }
  return JSON.stringify(result);
};

const getResponseText = (responseBody: any, statusCode: number = 200) => {
  if ([200, 201, -3].includes(statusCode)) {
    if (responseBody?.error) {
      return responseBody?.error?.message || "";
    }

    // Handle new format
    if (responseBody?.content && Array.isArray(responseBody.content)) {
      const textContent = responseBody.content.find(
        (item: any) => item.type === "text"
      );
      if (textContent) {
        // Remove any undefined values and clean up the text
        return (textContent.text || "").replace(/undefined/g, "").trim();
      }
    }

    // Handle old format with choices
    if (responseBody?.choices && Array.isArray(responseBody.choices)) {
      const choice = responseBody.choices[0];
      if (typeof choice?.message?.content === "string") {
        try {
          // Try to parse stringified JSON content
          const parsedContent = JSON.parse(choice.message.content);
          if (Array.isArray(parsedContent)) {
            const textContent = parsedContent.find(
              (item: any) => item.type === "text"
            );
            if (textContent) {
              return (textContent.text || "").replace(/undefined/g, "").trim();
            }
          }
          return JSON.stringify(parsedContent);
        } catch (e) {
          // If parsing fails, return the content as is
          return choice.message.content;
        }
      }
    }

    // Handle old format with content array
    if (Array.isArray(responseBody?.content)) {
      const toolUse = responseBody.content.find(
        (item: any) => item.type === "tool_use"
      );
      if (toolUse) {
        return `${toolUse.name}(${JSON.stringify(toolUse.input)})`;
      }

      const textContent = responseBody.content?.find(
        (item: any) => item.type === "text"
      );
      if (textContent) {
        // Remove any undefined values and clean up the text
        return (textContent.text || "").replace(/undefined/g, "").trim();
      }
    }

    return responseBody?.body
      ? responseBody?.body?.completion ?? ""
      : responseBody?.completion ?? "";
  } else if (statusCode === 0 || statusCode === null) {
    return "";
  } else {
    return responseBody?.error?.message || "";
  }
};

const getRequestMessages = (request: any) => {
  const requestMessages: Message[] = [];

  // Add system message first if it exists
  if (request?.system) {
    requestMessages.push({
      id: randomId(),
      role: "system",
      content: Array.isArray(request.system)
        ? request.system
            .map((item: any) => item.text || JSON.stringify(item))
            .join(" ")
        : typeof request.system === "string"
        ? request.system
        : JSON.stringify(request.system),
      _type: "message",
    });
  }

  // Then add other messages
  const messages =
    request.messages?.map((message: any) => {
      // Handle array content (for images + text, tool use, tool results)
      if (Array.isArray(message.content)) {
        const hasToolUse = message.content.some(
          (c: any) => c.type === "tool_use"
        );
        const hasToolResult = message.content.some(
          (c: any) => c.type === "tool_result"
        );

        // Create individual messages for each content item
        const contentArray = message.content
          .map((c: any) => {
            if (c.type === "text") {
              return {
                content: c.text,
                role: message.role,
                _type: "message",
              };
            } else if (c.type === "image" || c.type === "image_url") {
              return {
                content: "",
                role: message.role,
                _type: "image",
                image_url: c.image_url?.url || c.source?.data,
              };
            }
            return null;
          })
          .filter(Boolean);

        // Get text content from all text items
        const textContent = message.content
          .filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join(" ");

        // Get tool result content
        const toolResultContent = message.content
          .filter((c: any) => c.type === "tool_result")
          .map((c: any) => c.content)
          .join(" ");

        // Get tool use content
        const toolUseContent = message.content
          .filter((c: any) => c.type === "tool_use")
          .map((c: any) => `${c.name}(${JSON.stringify(c.input)})`)
          .join(" ");

        const finalContent = [textContent, toolUseContent, toolResultContent]
          .filter(Boolean)
          .join(" ");

        return {
          content: finalContent,
          role: message.role,
          _type: "contentArray",
          tool_calls: hasToolUse
            ? message.content
                .filter((c: any) => c.type === "tool_use")
                .map((c: any) => ({
                  id: c.id,
                  name: c.name,
                  arguments: c.input,
                }))
            : undefined,
          contentArray: contentArray.length > 0 ? contentArray : undefined,
        };
      }

      // Handle regular text content
      return {
        content:
          typeof message.content === "string"
            ? message.content
            : Array.isArray(message.content)
            ? message.content
                .map((item: any) => item.text || JSON.stringify(item))
                .join(" ")
            : JSON.stringify(message.content),
        role: message.role,
        _type: getContentType(message as any),
      };
    }) || [];

  requestMessages.push(...messages);

  return requestMessages;
};

const anthropicContentToMessage = (
  content: AnthropicContent,
  role: string
): Message => {
  if (!content?.type) {
    return {
      id: content?.id || randomId(),
      content:
        typeof content === "string"
          ? content
          : Array.isArray(content)
          ? content
              .map((item: any) => item.text || JSON.stringify(item))
              .join(" ")
          : JSON.stringify(content, null, 2),
      _type: "message",
      role,
    };
  }
  if (content.type === "text") {
    return {
      id: content.id || randomId(),
      content: (content.text || JSON.stringify(content, null, 2))
        .replace(/undefined/g, "")
        .trim(),
      _type: "message",
      role,
    };
  } else if (content.type === "tool_use") {
    return {
      id: content.id || randomId(),
      content: "",
      role: "assistant",
      tool_calls: [
        {
          name: content.name ?? "",
          arguments: content.input ?? {},
        },
      ],
      _type: "functionCall",
    };
  } else {
    return {
      id: content.id || randomId(),
      role: role,
      content:
        typeof content === "string"
          ? content
          : Array.isArray(content)
          ? content
              .map((item: any) => item.text || JSON.stringify(item))
              .join(" ")
          : JSON.stringify(content, null, 2),
      _type: "message",
    };
  }
};

const getLLMSchemaResponse = (response: any): LlmSchema["response"] => {
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
          heliconeMessage: JSON.stringify(response.error, null, 2),
        },
      };
    }
  } else {
    const messages: Message[] = [];

    // Handle new Claude 3 format and message_stop type
    if (
      (response?.type === "message" || response?.type === "message_stop") &&
      response?.content
    ) {
      if (Array.isArray(response.content)) {
        for (const content of response.content) {
          const message = anthropicContentToMessage(content, response.role);
          // Clean up any undefined strings in the content
          if (typeof message.content === "string") {
            message.content = message.content.replace(/undefined/g, "").trim();
          }
          messages.push(message);
        }
      } else {
        const message = anthropicContentToMessage(
          response.content,
          response.role
        );
        // Clean up any undefined strings in the content
        if (typeof message.content === "string") {
          message.content = message.content.replace(/undefined/g, "").trim();
        }
        messages.push(message);
      }
    }
    // Handle old format with choices
    else if (response?.choices && Array.isArray(response?.choices)) {
      for (const choice of response?.choices) {
        if (Array.isArray(choice.message?.content)) {
          for (const content of choice.message.content) {
            const message = anthropicContentToMessage(
              content,
              choice.message.role
            );
            // Clean up any undefined strings in the content
            if (typeof message.content === "string") {
              message.content = message.content
                .replace(/undefined/g, "")
                .trim();
            }
            messages.push(message);
          }
        } else if (typeof choice.message?.content === "string") {
          try {
            // Try to parse the content as JSON if it's a string
            const parsedContent = JSON.parse(choice.message.content);
            if (Array.isArray(parsedContent)) {
              for (const content of parsedContent) {
                const message = anthropicContentToMessage(
                  content,
                  choice.message.role
                );
                // Clean up any undefined strings in the content
                if (typeof message.content === "string") {
                  message.content = message.content
                    .replace(/undefined/g, "")
                    .trim();
                }
                messages.push(message);
              }
            } else {
              const message = anthropicContentToMessage(
                parsedContent,
                choice.message.role
              );
              // Clean up any undefined strings in the content
              if (typeof message.content === "string") {
                message.content = message.content
                  .replace(/undefined/g, "")
                  .trim();
              }
              messages.push(message);
            }
          } catch (e) {
            // If parsing fails, treat it as regular text content
            const message = anthropicContentToMessage(
              { type: "text", text: choice.message.content },
              choice.message.role
            );
            // Clean up any undefined strings in the content
            if (typeof message.content === "string") {
              message.content = message.content
                .replace(/undefined/g, "")
                .trim();
            }
            messages.push(message);
          }
        } else if (choice.message?.content) {
          const message = anthropicContentToMessage(
            choice.message.content,
            choice.message.role
          );
          // Clean up any undefined strings in the content
          if (typeof message.content === "string") {
            message.content = message.content.replace(/undefined/g, "").trim();
          }
          messages.push(message);
        }
      }
    }

    return {
      messages,
      model: response?.model,
    };
  }
};

export const mapAnthropicRequest: MapperFn<any, any> = ({
  request,
  response,
  statusCode = 200,
  model,
}) => {
  const requestMessages = getRequestMessages(request);
  const responseData = getLLMSchemaResponse(response);

  // Ensure we have a valid response object with messages
  const llmSchema: LlmSchema = {
    request: {
      messages: requestMessages,
      tool_choice: request.tool_choice,
      max_tokens: request.max_tokens,
      model: request.model || model,
    },
    response: responseData?.error
      ? responseData
      : {
          messages: responseData?.messages || [],
          model: responseData?.model || request.model || model,
        },
  };

  const concatenatedMessages = [
    ...requestMessages,
    ...(responseData?.messages || []),
  ];

  return {
    schema: llmSchema,
    preview: {
      request: getRequestText(request),
      response: getResponseText(response, statusCode),
      concatenatedMessages,
    },
  };
};
