import { LlmSchema, HeliconeEventVectorDB } from "../../types";
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
    vectorDBDetails: {
      _type: "vector_db",
      operation: request.operation,
      text: request.text,
      vector: request.vector,
      topK: request.topK,
      filter: request.filter,
      databaseName: request.databaseName,
    },
    messages: [],
  };

  const llmSchema: LlmSchema = {
    request: requestToReturn,
    response: {
      model: "vector_db",
      vectorDBDetailsResponse: {
        status: response?.status || "unknown",
        message: response?.message || "",
        similarityThreshold: response?.similarityThreshold,
        actualSimilarity: response?.actualSimilarity,
        metadata: {
          destination: response?.metadata?.destination,
          destination_parsed: response?.metadata?.destination_parsed,
          timestamp: new Date().toISOString(),
        },
        _type: "vector_db",
      },
      messages: [],
    },
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
