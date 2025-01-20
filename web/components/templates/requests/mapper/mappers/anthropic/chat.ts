import { LlmSchema, Message } from "../../types";
import { getContentType } from "../../utils/contentHelpers";
import { getFormattedMessageContent } from "../../utils/messageUtils";
import { MapperFn } from "../types";

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
  return JSON.stringify(requestBody);
};

const getResponseText = (responseBody: any, statusCode: number = 200) => {
  if ([200, 201, -3].includes(statusCode)) {
    if (responseBody?.error) {
      return responseBody?.error?.message || "";
    }

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
  const requestMessages: Message[] = request.messages?.map((message: any) => ({
    content: getFormattedMessageContent(message.content),
    role: message.role,
    _type: getContentType(message as any),
  }));

  if (
    request?.system &&
    !requestMessages.some(
      (msg: any) => msg?.role === "system" && msg?.content === request?.system
    )
  ) {
    requestMessages.push({
      id: crypto.randomUUID(),
      role: "system",
      content: request?.system,
      _type: "message",
    });
  }
  return requestMessages;
};

const anthropicContentToMessage = (
  content: AnthropicContent,
  role: string
): Message => {
  if (content.type === "text") {
    return {
      id: content.id || crypto.randomUUID(),
      content: getFormattedMessageContent(content.text),
      _type: "message",
      role,
    };
  } else if (content.type === "tool_use") {
    return {
      id: content.id || crypto.randomUUID(),
      tool_calls: [
        {
          arguments: content.input,
          name: content.name,
        },
      ],
      _type: "functionCall",
      role,
    };
  } else {
    return {
      id: content.id || crypto.randomUUID(),
      role: role,
      content: getFormattedMessageContent(
        "UKNOWN ANTHROPIC BODY" + JSON.stringify(content)
      ),
      _type: "message",
    };
  }
};

const getLLMSchemaResponse = (
  response: {
    choices: AnthropicChoice[];
  } & Record<string, any>
): LlmSchema["response"] => {
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
          heliconeMessage: JSON.stringify(response.error),
        },
      };
    }
  } else {
    const messages: Message[] = [];
    if (response?.choices && Array.isArray(response?.choices)) {
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
}) => {
  const llmSchema: LlmSchema = {
    request: {
      messages: getRequestMessages(request),
      tool_choice: request.tool_choice,
    },
    response: getLLMSchemaResponse(response),
  };
  return {
    schema: llmSchema,
    preview: {
      request: getRequestText(request),
      response: getResponseText(response, statusCode),
      concatenatedMessages: [],
    },
  };
};
