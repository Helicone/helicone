import { MapperFn } from "../types";
import { LlmSchema } from "../../types";

const getRequestText = (requestBody: any) => {
  if (requestBody.instructions) {
    return requestBody.instructions;
  }
  if (requestBody.role && requestBody.content) {
    return JSON.stringify(
      {
        role: requestBody.role,
        content: requestBody.content,
        metadata: requestBody.metadata,
      },
      null,
      2
    );
  }
  return JSON.stringify(requestBody, null, 2);
};

const getResponseText = (responseBody: any) => {
  if (responseBody?.data && Array.isArray(responseBody.data)) {
    const assistantMessage = responseBody.data.find(
      (msg: any) => msg.role === "assistant"
    );
    if (assistantMessage?.content?.[0]?.text?.value) {
      return assistantMessage.content[0].text.value;
    }
  }
  return JSON.stringify(responseBody, null, 2);
};

export const mapOpenAIRequest: MapperFn<any, any> = ({
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
    tool_choice: request.tool_choice,
  };

  const llmSchema: LlmSchema = {
    request: requestToReturn,
    response: null,
  };
  return {
    schema: llmSchema,
    preview: {
      request: getRequestText(request),
      response: getResponseText(response),
      concatenatedMessages: [],
    },
  };
};
