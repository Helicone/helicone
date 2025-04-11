import { Message } from "../types";

export const isJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

export const hasFunctionCall = (message: any): boolean =>
  !!message?.function_call ||
  (Array.isArray(message?.tool_calls) && message?.tool_calls?.length > 0) ||
  (Array.isArray(message?.content) &&
    message?.content?.some(
      (item: any) =>
        typeof item === "object" &&
        item !== null &&
        "type" in item &&
        item.type === "tool_use"
    ));

export const hasImage = (message: Message): boolean =>
  Array.isArray(message?.content) &&
  message?.content?.some(
    (item) => item?.type === "image_url" || item?.type === "image"
  );

export function getContentType(message: any): Message["_type"] {
  if (message?.role === "function") return "function";
  if (hasFunctionCall(message)) return "functionCall";
  if (hasImage(message)) return "image";
  if (
    typeof message === "string" &&
    (message as string).includes("helicone-auto-prompt-input")
  )
    return "autoInput";
  return "message";
}
