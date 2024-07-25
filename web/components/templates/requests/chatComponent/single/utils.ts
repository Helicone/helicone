import { Message } from "../types";
import { removeLeadingWhitespace } from "../../../../shared/utils/utils";

export function getContentType(
  message: Message
): "function" | "functionCall" | "image" | "message" | "autoInput" {
  if (message.role === "function") return "function";
  if (hasFunctionCall(message)) return "functionCall";
  if (hasImage(message)) return "image";
  if (
    typeof message === "string" &&
    (message as string).includes("helicone-auto-prompt-input")
  )
    return "autoInput";
  return "message";
}

export const isJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

export const getFormattedMessageContent = (message: Message): string => {
  if (Array.isArray(message.content)) {
    if (message.content.length > 0 && typeof message.content[0] === "string") {
      return message.content[0];
    }
    const textMessage = message.content.find((msg) => msg.type === "text");
    return textMessage?.text || "";
  }
  return removeLeadingWhitespace(message?.content?.toString() || "");
};

export const hasFunctionCall = (message: Message): boolean =>
  !!message.function_call ||
  (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) ||
  (Array.isArray(message.content) &&
    message.content.some(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "type" in item &&
        item.type === "tool_use"
    ));

export const hasImage = (message: Message): boolean =>
  Array.isArray(message.content) &&
  message.content.some(
    (item) => item.type === "image_url" || item.type === "image"
  );
