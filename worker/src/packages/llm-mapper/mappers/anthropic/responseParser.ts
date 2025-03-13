import { LlmSchema, Message } from "../../types";
import { getContentType } from "../../utils/contentHelpers";
import { MapperFn } from "../types";

const randomId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};
const anthropicContentToMessage = (content: any, role: string): Message => {
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

export const getLLMSchemaResponse = (response: any): LlmSchema["response"] => {
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
