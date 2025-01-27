import { removeLeadingWhitespace } from "@/components/shared/utils/utils";

export const getFormattedMessageContent = (content: any): string => {
  if (Array.isArray(content)) {
    if (content.length > 0 && typeof content[0] === "string") {
      return content[0];
    }
    const textMessage = content.find((msg: any) => msg.type === "text");
    return textMessage?.text || "";
  }
  return removeLeadingWhitespace(content?.toString() || "");
};
