import { Message } from "../../types";
import { getContentType } from "../../utils/contentHelpers";

const randomId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

const getMessageContent = (message: any) => {
  if (message.type === "text") {
    return message.text;
  }
  if (message.type === "image" || message.type === "image_url") {
    return "";
  }
  if (message.type === "tool_use") {
    return `${message.name}(${JSON.stringify(message.input)})`;
  }

  // tool_result is handled below
  return typeof message.content === "string"
    ? message.content
    : JSON.stringify(message.content);
};

const anthropicMessageToMessage = (message: any, role?: string): Message => {
  const messageRole = role || message.role;
  // Handle array content (for images + text, tool use, tool results)
  if (Array.isArray(message.content)) {
    return {
      role: messageRole,
      _type: "contentArray",
      contentArray: message.content.map((c: any) =>
        anthropicMessageToMessage(c, messageRole)
      ),
      id: randomId(),
    };
  }
  if (message.type === "image" || message.type === "image_url") {
    return {
      content: getMessageContent(message),
      role: messageRole,
      _type: "image",
      image_url:
        message.type === "image" || message.type === "image_url"
          ? message.image_url?.url || message.source?.data
          : undefined,
      id: randomId(),
    };
  }
  if (message.type === "tool_use") {
    return {
      content: getMessageContent(message),
      role: messageRole,
      _type: "function",
      tool_calls: [
        {
          name: message.name,
          arguments: message.input,
        },
      ],
      id: randomId(),
    };
  }
  if (message.type === "tool_result") {
    return {
      content: getMessageContent(message),
      role: messageRole,
      _type: "functionCall",
      tool_call_id: message.tool_use_id,
      id: randomId(),
    };
  }
  return {
    content: getMessageContent(message),
    role: messageRole,
    _type: getContentType(message as any),
    id: randomId(),
  };
};
export const getRequestMessages = (request: any) => {
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

  requestMessages.push(
    ...(request.messages?.map((message: any) => {
      return anthropicMessageToMessage(message);
    }) || [])
  );

  return requestMessages;
};
