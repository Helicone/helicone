import { LlmSchema } from "../../types";
import { MapperFn } from "../types";

const getRequestText = (requestBody: any) => {
  if (requestBody._type !== "vector_db") return "";

  const parts = [
    `Operation: ${requestBody.operation}`,
    `Database: ${requestBody.databaseName}`,
    requestBody.text ? `Text: ${requestBody.text}` : null,
    requestBody.query ? `Query: ${requestBody.query}` : null,
    requestBody.topK ? `Top K: ${requestBody.topK}` : null,
    requestBody.filter ? `Filter: ${JSON.stringify(requestBody.filter)}` : null,
  ].filter(Boolean);

  return parts.join("\n");
};

const getResponseText = (responseBody: any, statusCode: number = 200) => {
  if (statusCode !== 200 || responseBody?.status === "error") {
    return (
      responseBody?.error?.message ||
      responseBody?.message ||
      "Vector DB operation failed"
    );
  }

  if (responseBody._type !== "vector_db") {
    return JSON.stringify(responseBody);
  }

  return responseBody.message || JSON.stringify(responseBody);
};

export const mapVectorDB: MapperFn<any, any> = ({
  request,
  response,
  statusCode = 200,
}) => {
  const requestToReturn: LlmSchema["request"] = {
    model: "vector_db",
    messages: [
      {
        role: "system",
        content: `Vector DB ${request.operation} operation`,
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
      model: "vector_db",
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
