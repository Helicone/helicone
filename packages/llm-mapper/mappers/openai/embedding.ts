import { LlmSchema } from "../../types";
import { MapperFn } from "../types";

const getRequestText = (requestBody: any) => {
  return requestBody.input || "";
};

const getResponseText = (responseBody: any, statusCode: number = 200) => {
  return JSON.stringify(responseBody?.data?.[0].embedding, null, 4);
};

export const mapOpenAIModeration: MapperFn<any, any> = ({
  request,
  response,
  statusCode = 200,
  model,
}) => {
  const requestToReturn: LlmSchema["request"] = {
    model: request.model,
  };

  const llmSchema: LlmSchema = {
    request: requestToReturn,
    response: {
      model: "openai/moderation",
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
