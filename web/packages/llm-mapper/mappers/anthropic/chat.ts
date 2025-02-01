import { LlmSchema, Message } from "../../types";
import { getContentType } from "../../utils/contentHelpers";
import { getFormattedMessageContent } from "../../utils/messageUtils";
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

type AnthropicChoice = {
  role: string;
  content: AnthropicContent[] | AnthropicContent;
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
        return textContent.text || "";
      }
    }

    // Handle old format
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
        return textContent.text || "";
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
        const hasImage = message.content.some((c: any) => c.type === "image");
        const hasToolUse = message.content.some(
          (c: any) => c.type === "tool_use"
        );
        const hasToolResult = message.content.some(
          (c: any) => c.type === "tool_result"
        );

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
          _type: hasImage ? "image" : "message",
          image_url: hasImage
            ? message.content.find((c: any) => c.type === "image")?.source?.data
            : undefined,
          tool_calls: hasToolUse
            ? message.content
                .filter((c: any) => c.type === "tool_use")
                .map((c: any) => ({
                  id: c.id,
                  name: c.name,
                  arguments: c.input,
                }))
            : undefined,
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
      content: content.text || JSON.stringify(content, null, 2),
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

    // Handle new Claude 3 format
    if (response?.type === "message" && response?.content) {
      if (Array.isArray(response.content)) {
        for (const content of response.content) {
          messages.push(anthropicContentToMessage(content, response.role));
        }
      } else {
        messages.push(
          anthropicContentToMessage(response.content, response.role)
        );
      }
    }
    // Handle old format with choices
    else if (response?.choices && Array.isArray(response?.choices)) {
      for (const choice of response?.choices) {
        if (Array.isArray(choice.content)) {
          for (const content of choice.content) {
            messages.push(anthropicContentToMessage(content, choice.role));
          }
        } else {
          messages.push(anthropicContentToMessage(choice.content, choice.role));
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
