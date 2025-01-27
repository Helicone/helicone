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
    if (responseBody?.error) {
      return responseBody?.error?.message || "";
    }

    if (responseBody?.data) {
      return responseBody?.data[0]?.revised_prompt ?? "";
    }
  } else if (statusCode === 0 || statusCode === null) {
    return "";
  } else {
    return responseBody?.error?.message || responseBody?.helicone_error || "";
  }
};

export const mapOpenAIModeration: MapperFn<any, any> = ({
  request,
  response,
  statusCode = 200,
  model,
}) => {
  const responseText = getResponseText(response, statusCode);
  const requestToReturn: LlmSchema["request"] = {
    model: request.model,
  };

  const llmSchema: LlmSchema = {
    request: requestToReturn,
    response: {
      messages: [
        {
          image_url: response.response_body?.data
            ? response.response_body?.data[0]?.url
            : "",
          content: responseText,
          _type: "image",
        },
      ],
      model: response.model,
    },
  };
  return {
    schema: llmSchema,
    preview: {
      request: getRequestText(request),
      response: responseText,
      concatenatedMessages: [],
    },
  };
};
