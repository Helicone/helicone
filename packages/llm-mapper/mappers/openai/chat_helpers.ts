import { Message, FunctionCall } from "../../types";

export interface ToolCall {
  function: {
    name: string;
    arguments: string;
  };
  type: string;
  id: string;
}

export const isImageContent = (content: any): boolean => {
  return (
    typeof content === "object" &&
    content !== null &&
    content.type === "image_url" &&
    content.image_url?.url
  );
};

export const parseFunctionArguments = (
  args: string | undefined
): Record<string, any> => {
  try {
    return JSON.parse(args ?? "{}");
  } catch {
    return {};
  }
};

export const mapToolCallToFunction = (tool: ToolCall): FunctionCall => ({
  name: tool.function?.name ?? "",
  arguments: parseFunctionArguments(tool.function?.arguments),
});

export const handleArrayContent = (content: any[]): string => {
  const textContent = content.find(
    (item: any) => typeof item === "string" || item?.type === "text"
  );

  if (textContent) {
    return typeof textContent === "string" ? textContent : textContent.text;
  }

  const imageContent = content.find(isImageContent);
  if (imageContent) {
    return "[Image]";
  }

  return JSON.stringify(content);
};

export const handleObjectContent = (content: any): string => {
  if (content.transcript) return content.transcript;
  if (content.text) return content.text;
  return JSON.stringify(content);
};

export const handleToolCalls = (message: any): Message => ({
  content: "",
  role: message.role ?? "assistant",
  tool_calls: message.function_call
    ? [
        {
          name: message.function_call.name,
          arguments: parseFunctionArguments(message.function_call.arguments),
        },
      ]
    : message.tool_calls?.map(mapToolCallToFunction) ?? [],
  _type: "functionCall",
});

export const handleImageMessage = (msg: any, imageContent: any): Message => ({
  role: msg.role,
  _type: "image",
  content: msg.content?.text,
  image_url: imageContent.image_url.url,
});

export const handleToolResponse = (msg: any): Message => ({
  content: msg.content,
  role: msg.role,
  tool_call_id: msg.tool_call_id,
  _type: "message",
});

export const formatStreamingToolCalls = (toolCalls: ToolCall[]): string => {
  return toolCalls
    .map((tool: ToolCall) => {
      const args = parseFunctionArguments(tool.function.arguments);
      return `${tool.function.name}(${JSON.stringify(args)})`;
    })
    .join("\n");
};

export const handleClaudeResponse = (responseBody: any): string | undefined => {
  if (responseBody?.content?.[0].type === "tool_use") {
    const toolUse = responseBody.content.find(
      (item: any) => item.type === "tool_use"
    );
    if (toolUse) {
      return `${toolUse.name}(${JSON.stringify(toolUse.input)})`;
    }
  }
  if (responseBody?.content?.[0]?.text) {
    return responseBody.content[0].text;
  }
  return undefined;
};
