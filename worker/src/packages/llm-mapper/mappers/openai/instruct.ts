/* eslint-disable @typescript-eslint/no-explicit-any */
import { LlmSchema } from "../../types";
import { getFormattedMessageContent } from "../../utils/messageUtils";
import { MapperFn } from "../types";

const getRequestText = (requestBody: any) => {
  try {
    const heliconeMessage = requestBody?.heliconeMessage;
    if (heliconeMessage) {
      return heliconeMessage;
    }

    return typeof requestBody?.prompt === "string"
      ? requestBody.prompt
      : JSON.stringify(requestBody?.prompt || "");
  } catch (error) {
    console.error("Error parsing request text:", error);
    return "error_parsing_request";
  }
};

const getResponseText = (
  responseBody: any,
  statusCode: number = 200,
  model: string
) => {
  if (statusCode === 0 || statusCode === null) {
    return "";
  }

  if ("error" in responseBody) {
    return responseBody.error.heliconeMessage;
  }

  try {
    // Handle pending response or network error scenarios upfront
    if (statusCode === 0 || statusCode === null) return ""; // Pending response
    if (![200, 201, -3].includes(statusCode)) {
      // Network error or other non-success statuses
      return responseBody?.error?.message || responseBody?.helicone_error || "";
    }

    // For successful responses
    if (responseBody?.error) {
      // Check for an error from OpenAI
      return responseBody.error.message || "";
    }

    // Handle streaming response chunks
    if (responseBody?.object === "text_completion") {
      const choice = responseBody.choices?.[0];
      if (choice?.text) {
        return choice.text;
      }
      return ""; // Empty string for other cases in streaming
    }

    // Handle choices
    const firstChoice = responseBody?.choices?.[0];
    if (firstChoice) {
      return firstChoice.text || "";
    }
    // Fallback for missing choices
    return "";
  } catch (error) {
    console.error("Error parsing response text:", error);
    return "error_parsing_response";
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
          heliconeMessage: JSON.stringify(response.error),
        },
      };
    }
  } else {
    return {
      messages: response?.choices?.map((choice: any) => ({
        content: getFormattedMessageContent(choice?.text ?? ""),
        role: "assistant",
        _type: "message",
      })),
      model: response?.model,
    };
  }
};

export const mapOpenAIInstructRequest: MapperFn<any, any> = ({
  request,
  response,
  statusCode = 200,
  model,
}) => {
  const requestToReturn: LlmSchema["request"] = {
    frequency_penalty: request.frequency_penalty,
    max_tokens: request.max_tokens,
    model: request.model,
    presence_penalty: request.presence_penalty,
    temperature: request.temperature,
    top_p: request.top_p,
    messages: [
      {
        content: request.prompt as string,
        role: "user",
        _type: "message",
      },
    ],
  };

  const llmSchema: LlmSchema = {
    request: requestToReturn,
    response: getLLMSchemaResponse(response),
  };
  return {
    schema: llmSchema,
    preview: {
      request: getRequestText(request),
      response: getResponseText(response, statusCode, model),
      concatenatedMessages:
        llmSchema.request.messages?.concat(
          llmSchema.response?.messages ?? []
        ) ?? [],
    },
  };
};
