import { MapperFn } from "../types";
import { LlmSchema } from "../../types";

const getRequestText = (requestBody: any) => {
  // For assistant requests, we might not have a request body
  // since the thread might have been created earlier
  if (!requestBody) return "Assistant thread interaction";

  const parts = [];
  if (requestBody.assistant_id) {
    parts.push(`Assistant ID: ${requestBody.assistant_id}`);
  }
  if (requestBody.thread_id) {
    parts.push(`Thread ID: ${requestBody.thread_id}`);
  }
  if (requestBody.instructions) {
    parts.push(`Instructions: ${requestBody.instructions}`);
  }
  if (requestBody.tools) {
    parts.push(
      `Available Tools: ${requestBody.tools.map((t: any) => t.type).join(", ")}`
    );
  }

  return parts.join("\n") || "Assistant thread interaction";
};

const getResponseText = (responseBody: any, statusCode: number = 200) => {
  if (statusCode !== 200 || responseBody?.status === "failed") {
    return responseBody?.last_error?.message || "Assistant operation failed";
  }

  const parts = [];

  if (responseBody.status) {
    parts.push(`Status: ${responseBody.status}`);
  }

  if (responseBody.model) {
    parts.push(`Model: ${responseBody.model}`);
  }

  if (responseBody.tools?.length) {
    parts.push(`Tools Available: ${responseBody.tools.length}`);
  }

  return parts.join("\n") || JSON.stringify(responseBody);
};

export const mapOpenAIAssistant: MapperFn<any, any> = ({
  request,
  response,
  statusCode = 200,
  model,
}) => {
  const requestToReturn: LlmSchema["request"] = {
    model: model || response?.model,
    messages: [
      {
        role: "system",
        content: "OpenAI Assistant Interaction",
        _type: "message",
      },
      {
        role: "user",
        content: getRequestText(request),
        _type: "message",
      },
    ],
  };

  const llmSchema: LlmSchema = {
    request: requestToReturn,
    response: {
      model: response?.model || model,
      messages: [
        {
          role: "assistant",
          content: getResponseText(response, statusCode),
          _type: "message",
        },
      ],
    },
  };

  return {
    schema: llmSchema,
    preview: {
      request: getRequestText(request),
      response: getResponseText(response, statusCode),
      concatenatedMessages: [
        ...(llmSchema.request.messages || []),
        ...(llmSchema.response?.messages || []),
      ],
    },
  };
};
