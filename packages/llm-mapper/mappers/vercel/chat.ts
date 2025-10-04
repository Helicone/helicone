import { LlmSchema, Message } from "../../types";
import { MapperFn } from "../types";

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

  // Handle Vercel AI SDK format with 'prompt' field
  if (requestBody.prompt && Array.isArray(requestBody.prompt)) {
    const lastMessage = requestBody.prompt[requestBody.prompt.length - 1];
    if (typeof lastMessage?.content === "string") {
      return lastMessage.content;
    }
    if (Array.isArray(lastMessage?.content)) {
      return lastMessage.content
        .map((item: any) => item.text || JSON.stringify(item))
        .join(" ");
    }
  }
  // Handle standard format with 'messages' field
  else if (requestBody.messages && Array.isArray(requestBody.messages)) {
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

    // Handle Vercel AI SDK response format
    if (responseBody?.content && Array.isArray(responseBody.content)) {
      return responseBody.content
        .map((item: any) => {
          if (item.type === "text" && item.text) {
            return item.text;
          }
          return "";
        })
        .join("");
    }

    // Handle streaming format
    if (responseBody?.choices?.[0]?.message?.content) {
      return responseBody.choices[0].message.content;
    }

    return "";
  } else if (statusCode === 0 || statusCode === null) {
    return "";
  } else {
    return responseBody?.error?.message || "";
  }
};

const vercelMessageToMessage = (message: any): Message => {
  const messageRole = message.role || "user";

  // Handle content array - flatten it to extract text
  if (Array.isArray(message.content)) {
    const textContent = message.content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text || "")
      .join("");

    // Check if there are any images
    const imageContent = message.content.find(
      (c: any) => c.type === "image" || c.type === "image_url",
    );

    if (imageContent) {
      return {
        content: textContent,
        role: messageRole,
        _type: "image",
        image_url: imageContent.image_url?.url || imageContent.url,
        id: randomId(),
      };
    }

    return {
      content: textContent,
      role: messageRole,
      _type: "message",
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

  // Handle Vercel AI SDK format with 'prompt' field
  if (request.prompt && Array.isArray(request.prompt)) {
    requestMessages.push(
      ...request.prompt.map((message: any) => vercelMessageToMessage(message)),
    );
  }
  // Handle standard format with 'messages' field
  else if (request.messages && Array.isArray(request.messages)) {
    requestMessages.push(
      ...request.messages.map((message: any) =>
        vercelMessageToMessage(message),
      ),
    );
  }

  return requestMessages;
};

const getResponseMessages = (response: any): Message[] => {
  const messages: Message[] = [];

  // Handle Vercel AI SDK non-streaming response format
  if (response?.content && Array.isArray(response.content)) {
    const textContent = response.content
      .filter((item: any) => item.type === "text")
      .map((item: any) => item.text)
      .join("");

    if (textContent) {
      messages.push({
        id: randomId(),
        role: "assistant",
        content: textContent,
        _type: "message",
      });
    }
  }
  // Handle streaming format (OpenAI-compatible)
  else if (response?.choices && Array.isArray(response.choices)) {
    response.choices.forEach((choice: any) => {
      if (choice.message) {
        if (
          choice.message.tool_calls &&
          Array.isArray(choice.message.tool_calls)
        ) {
          messages.push({
            id: randomId(),
            role: "assistant",
            content: "",
            _type: "functionCall",
            tool_calls: choice.message.tool_calls.map((toolCall: any) => {
              let parsedArguments = toolCall.function?.arguments || {};

              if (typeof toolCall.function?.arguments === "string") {
                try {
                  parsedArguments = JSON.parse(toolCall.function.arguments);
                } catch (e) {
                  console.error("Error parsing tool call arguments:", e);
                  parsedArguments = {};
                }
              }

              return {
                id: toolCall.id,
                name: toolCall.function?.name || "",
                arguments: parsedArguments,
              };
            }),
          });
        } else if (choice.message.content) {
          messages.push({
            id: randomId(),
            role: choice.message.role || "assistant",
            content: choice.message.content,
            _type: "message",
          });
        }
      }
    });
  }

  return messages;
};

const getModelFromResponse = (
  response: any,
  request: any,
  model: string,
): string => {
  // Try to get model from Vercel's provider metadata
  return (
    response?.providerMetadata?.gateway?.routing?.originalModelId ||
    response?.modelId ||
    response?.model ||
    request?.model ||
    model ||
    "unknown"
  );
};

export const mapVercelRequest: MapperFn<any, any> = ({
  request,
  response,
  statusCode = 200,
  model,
}) => {
  const requestMessages = getRequestMessages(request);
  const responseMessages = getResponseMessages(response);
  const responseModel = getModelFromResponse(response, request, model);

  const llmSchema: LlmSchema = {
    request: {
      messages: requestMessages,
      model: request.model || model,
      max_tokens:
        request.maxOutputTokens || request.maxTokens || request.max_tokens,
      temperature: request.temperature,
      top_p: request.topP || request.top_p,
      tools: request.tools?.map((tool: any) => ({
        name: tool.function?.name || "",
        description: tool.function?.description || "",
        parameters: tool.function?.parameters || {},
      })),
      tool_choice: request.toolChoice || request.tool_choice,
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
          model: responseModel,
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
