import { LlmSchema } from "../../types";
import { MapperFn } from "../types";

const getRequestText = (requestBody: any) => {
  if (typeof requestBody.input === "string") {
    return requestBody.input;
  }
  if (Array.isArray(requestBody.input)) {
    return requestBody.input.join("\n");
  }
  return JSON.stringify(requestBody.input || "");
};

const getResponseText = (responseBody: any, statusCode: number = 200) => {
  if ([200, 201, -3].includes(statusCode)) {
    if (responseBody?.error) {
      return responseBody?.error?.message || "";
    }
    // Return first embedding vector truncated for preview
    const embedding = responseBody?.data?.[0]?.embedding;
    if (Array.isArray(embedding)) {
      return `[${embedding
        .slice(0, 5)
        .map((n) => n.toFixed(6))
        .join(", ")}...]`;
    }
    return "";
  } else if (statusCode === 0 || statusCode === null) {
    return "";
  } else {
    return responseBody?.error?.message || "";
  }
};

export const mapOpenAIEmbedding: MapperFn<any, any> = ({
  request,
  response,
  statusCode = 200,
  model,
}) => {
  const requestToReturn: LlmSchema["request"] = {
    model: request.model,
    input: request.input,
    messages: [
      {
        role: "user",
        content: getRequestText(request),
        _type: "message",
      },
    ],
  };

  const responseMessages =
    response?.data?.map((item: any, index: number) => ({
      role: "assistant",
      content: `Embedding ${index}: [${item.embedding
        .slice(0, 5)
        .map((n: number) => n.toFixed(6))
        .join(", ")}...]`,
      _type: "message",
    })) || [];

  const llmSchema: LlmSchema = {
    request: requestToReturn,
    response: {
      model: response?.model || model,
      messages: responseMessages,
    },
  };

  const concatenatedMessages = [
    ...(llmSchema.request.messages || []),
    ...(llmSchema.response?.messages || []),
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
