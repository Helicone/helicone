import { LlmSchema } from "../../types";
import { MapperFn } from "../types";

const getRequestText = (requestBody: any) => {
  if (requestBody.prompt) {
    return requestBody.prompt;
  }

  return "";
};

const getResponseText = (responseBody: any, statusCode: number = 200) => {
  if ([200, 201, -3].includes(statusCode)) {
    if (responseBody.response_body?.error) {
      return responseBody.response_body?.error?.message || "";
    }

    // Since Flux doesn't have revised prompts, return an empty string
    return "";
  } else if (statusCode === 0 || statusCode === null) {
    return "";
  } else {
    return (
      responseBody.response_body?.error?.message ||
      responseBody.response_body?.helicone_error ||
      ""
    );
  }
};

export const mapBlackForestLabsImage: MapperFn<any, any> = ({
  request,
  response,
  statusCode = 200,
  model,
}) => {
  const requestToReturn: LlmSchema["request"] = {
    model: request.model,
    messages: [
      {
        role: "user",
        content: request.prompt,
        _type: "message",
      },
    ],
  };

  const llmSchema: LlmSchema = {
    request: requestToReturn,
    response: {
      model: "black-forest-labs/FLUX.1-schnell",
      messages: [
        {
          role: "assistant",
          content: response?.data[0]?.b64_json,
          image_url: response?.data ? response?.data[0]?.b64_json : "",
          _type: "image",
        },
      ],
    },
  };
  return {
    schema: llmSchema,
    preview: {
      request: getRequestText(request),
      response: getResponseText(response, statusCode),
      concatenatedMessages:
        llmSchema.request.messages?.concat(
          llmSchema.response?.messages ?? []
        ) ?? [],
    },
  };
};
