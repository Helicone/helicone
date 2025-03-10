import { LlmSchema } from "../../types";
import { MapperFn } from "../types";

interface DalleRequestBody {
  model: string;
  prompt?: string;
  size?: string;
  quality?: string;
  response_format?: string;
}

const getRequestText = (requestBody: any) => {
  return requestBody?.prompt || "";
};

const getResponseText = (responseBody: any, statusCode: number = 200) => {
  if ([200, 201, -3].includes(statusCode)) {
    if (responseBody?.error) {
      return responseBody?.error?.message || "";
    }
    return responseBody?.data?.[0]?.revised_prompt || "";
  } else if (statusCode === 0 || statusCode === null) {
    return "";
  } else {
    return responseBody?.error?.message || "";
  }
};

export const mapDalleRequest: MapperFn<DalleRequestBody, any> = ({
  request,
  response,
  statusCode = 200,
  model,
}) => {
  const llmSchema: LlmSchema = {
    request: {
      model: request.model,
      prompt: request.prompt,
      size: request.size,
      quality: request.quality,
      response_format: request.response_format
        ? {
            type: request.response_format,
            json_schema: {},
          }
        : undefined,
    },
    response: {
      messages: [
        {
          content: response?.data?.[0]?.revised_prompt || "",
          _type: "image",
          image_url:
            response?.data?.[0]?.b64_json || response?.data?.[0]?.url || "",
        },
      ],
      model: model,
    },
  };

  return {
    schema: llmSchema,
    preview: {
      request: getRequestText(request),
      response: getResponseText(response, statusCode),
      concatenatedMessages: [
        {
          content: request.prompt || "",
          role: "user",
          _type: "message",
        },
        {
          content: response?.data?.[0]?.revised_prompt || "",
          role: "assistant",
          _type: "image",
          image_url:
            response?.data?.[0]?.b64_json || response?.data?.[0]?.url || "",
        },
      ],
    },
  };
};
