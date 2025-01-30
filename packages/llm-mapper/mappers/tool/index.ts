import { LlmSchema } from "../../types";
import { MapperFn } from "../types";

const getRequestText = (requestBody: any) => {
  if (requestBody._type !== "tool") return "";

  const parts = [
    `Tool: ${requestBody.toolName}`,
    `Input: ${JSON.stringify(requestBody.input, null, 2)}`,
  ].filter(Boolean);

  return parts.join("\n");
};

const getResponseText = (responseBody: any, statusCode: number = 200) => {
  if (statusCode !== 200 || responseBody?.status === "error") {
    return (
      responseBody?.error?.message ||
      responseBody?.message ||
      "Tool operation failed"
    );
  }

  if (responseBody._type !== "tool") {
    return JSON.stringify(responseBody);
  }

  // For successful responses, create a summary
  const summary = [];

  if (responseBody.status) {
    summary.push(`Status: ${responseBody.status}`);
  }

  // Add specific summaries based on tool response structure
  if (responseBody.hotels) {
    summary.push(`Found ${responseBody.hotels.length} hotels`);
    summary.push(
      `Price range: $${responseBody.filters?.priceRange?.min} - $${responseBody.filters?.priceRange?.max}`
    );
  }

  return (
    summary.join("\n") || responseBody.message || JSON.stringify(responseBody)
  );
};

export const mapTool: MapperFn<any, any> = ({
  request,
  response,
  statusCode = 200,
}) => {
  const requestToReturn: LlmSchema["request"] = {
    model: `tool:${request.toolName}`,
    messages: [
      {
        role: "system",
        content: `Tool operation: ${request.toolName}`,
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
      model: `tool:${request.toolName}`,
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
