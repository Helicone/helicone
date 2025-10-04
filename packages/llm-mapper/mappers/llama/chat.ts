import { LlmSchema, Message } from "../../types";
import { MapperFn } from "../types";

// NOTE FOR DEVS:
// -> This Llama mapper is WIP! It takes a lot of code/inspo
// from the Anthropic mapper - hopefully everything is supported but
// definitely something that will be improved as we go.

const randomId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

const getRequestText = (requestBody: any) => {
  if (requestBody.tooLarge) {
    return "Helicone Message: Input too large";
  }

  if (requestBody.messages && Array.isArray(requestBody.messages)) {
    const lastMessage = requestBody.messages[requestBody.messages.length - 1];
    if (typeof lastMessage?.content === "string") {
      return lastMessage.content;
    }
    if (Array.isArray(lastMessage?.content)) {
      return lastMessage.content
        .map((item: any) => item.text || JSON.stringify(item))
        .join(" ");
    }
  }

  return JSON.stringify(requestBody);
};

const getResponseText = (responseBody: any, statusCode: number = 200) => {
  if ([200, 201, -3].includes(statusCode)) {
    if (responseBody?.error) {
      return responseBody.error.message || "";
    }

    if (responseBody?.completion_message?.content) {
      const content = responseBody.completion_message.content;
      if (typeof content === "string") {
        return content;
      }
      if (typeof content === "object" && content.text) {
        return content.text;
      }
    }

    return "";
  } else if (statusCode === 0 || statusCode === null) {
    return "";
  } else {
    return responseBody?.error?.message || "";
  }
};

const llamaMessageToMessage = (message: any): Message => {
  const messageRole = message.role || "user";

  if (Array.isArray(message.content)) {
    return {
      role: messageRole,
      _type: "contentArray",
      contentArray: message.content.map((c: any) =>
        llamaMessageToMessage({
          ...c,
          role: messageRole,
        }),
      ),
      id: randomId(),
    };
  }

  if (message.type === "image_url") {
    return {
      content: "",
      role: messageRole,
      _type: "image",
      image_url: message.image_url?.url,
      id: randomId(),
    };
  }

  return {
    content:
      typeof message.content === "string"
        ? message.content
        : message.text || JSON.stringify(message.content || ""),
    role: messageRole,
    _type: "message",
    id: randomId(),
  };
};

const getRequestMessages = (request: any): Message[] => {
  const requestMessages: Message[] = [];

  if (request.messages && Array.isArray(request.messages)) {
    requestMessages.push(
      ...request.messages.map((message: any) => llamaMessageToMessage(message)),
    );
  }

  return requestMessages;
};

const getResponseMessages = (response: any): Message[] => {
  const messages: Message[] = [];

  if (response?.completion_message) {
    const completionMessage = response.completion_message;

    if (
      completionMessage.tool_calls &&
      Array.isArray(completionMessage.tool_calls)
    ) {
      messages.push({
        id: randomId(),
        role: "assistant",
        content: "",
        _type: "functionCall",
        tool_calls: completionMessage.tool_calls.map((toolCall: any) => ({
          id: toolCall.id,
          name: toolCall.function?.name || "",
          arguments:
            typeof toolCall.function?.arguments === "string"
              ? JSON.parse(toolCall.function.arguments)
              : toolCall.function?.arguments || {},
        })),
      });
    } else if (completionMessage.content) {
      const content = completionMessage.content;
      let textContent = "";

      if (typeof content === "string") {
        textContent = content;
      } else if (typeof content === "object" && content.text) {
        textContent = content.text;
      } else {
        textContent = JSON.stringify(content);
      }

      messages.push({
        id: randomId(),
        role: completionMessage.role || "assistant",
        content: textContent,
        _type: "message",
      });
    }
  }

  return messages;
};

export const mapLlamaRequest: MapperFn<any, any> = ({
  request,
  response,
  statusCode = 200,
  model,
}) => {
  const requestMessages = getRequestMessages(request);
  const responseMessages = getResponseMessages(response);

  const llmSchema: LlmSchema = {
    request: {
      messages: requestMessages,
      model: request.model || model,
      max_tokens: request.max_completion_tokens,
      temperature: request.temperature,
      top_p: request.top_p,
      tools: request.tools?.map((tool: any) => ({
        name: tool.function?.name || "",
        description: tool.function?.description || "",
        parameters: tool.function?.parameters || {},
      })),
      tool_choice: request.tool_choice,
      stream: request.stream,
    },
    response: response?.error
      ? {
          error: {
            heliconeMessage:
              response.error.message || JSON.stringify(response.error),
          },
        }
      : {
          messages: responseMessages,
          model: response?.completion_message?.model || request.model || model,
        },
  };

  const concatenatedMessages = [...requestMessages, ...responseMessages];

  return {
    schema: llmSchema,
    preview: {
      request: getRequestText(request),
      response: getResponseText(response, statusCode),
      concatenatedMessages,
    },
  };
};
