import { Message } from "../types";
import { removeLeadingWhitespace } from "../../../../shared/utils/utils";

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
  (message.tool_calls?.some((tool) => tool.type === "function") ?? false);

export const hasImage = (message: Message): boolean =>
  Array.isArray(message.content) &&
  message.content.some(
    (item) => item.type === "image_url" || item.type === "image"
  );
