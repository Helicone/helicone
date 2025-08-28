import { LlmSchema } from "../../types";
import { MapperFn } from "../types";
import { getRequestMessages } from "./requestParser";
import { getLLMSchemaResponse } from "./responseParser";

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

    // Handle AWS Bedrock Anthropic format
    if (responseBody?.output?.message?.content) {
      const content = responseBody.output.message.content;
      if (Array.isArray(content) && content[0]?.text) {
        return content[0].text || "";
      }
    }

    // Handle new format
    if (responseBody?.content && Array.isArray(responseBody.content)) {
      const textContent = responseBody.content.find(
        (item: any) => item.type === "text"
      );
      if (textContent) {
        // Remove any undefined values and clean up the text
        return (textContent.text || "").replace(/undefined/g, "").trim();
      }
    }

    // Handle old format with choices
    if (responseBody?.choices && Array.isArray(responseBody.choices)) {
      const choice = responseBody.choices[0];
      if (typeof choice?.message?.content === "string") {
        try {
          // Try to parse stringified JSON content
          const parsedContent = JSON.parse(choice.message.content);
          if (Array.isArray(parsedContent)) {
            const textContent = parsedContent.find(
              (item: any) => item.type === "text"
            );
            if (textContent) {
              return (textContent.text || "").replace(/undefined/g, "").trim();
            }
          }
          return JSON.stringify(parsedContent);
        } catch (e) {
          // If parsing fails, return the content as is
          return choice.message.content;
        }
      }
    }

    // Handle old format with content array
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
        // Remove any undefined values and clean up the text
        return (textContent.text || "").replace(/undefined/g, "").trim();
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
      tools: request.tools?.map((tool: any) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema,
      })),
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
