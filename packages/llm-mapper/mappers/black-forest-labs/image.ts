import { LlmSchema } from "../../types";
import { MapperFn } from "../types";

interface BlackForestLabsRequestBody {
  model: string;
  prompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  response_format?: string;
}

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

    // Since Flux doesn't have revised prompts, return a success message
    return "Image generated successfully";
  } else if (statusCode === 0 || statusCode === null) {
    return "";
  } else {
    return responseBody?.error?.message || "";
  }
};

export const mapBlackForestLabsImage: MapperFn<
  BlackForestLabsRequestBody,
  any
> = ({ request, response, statusCode = 200, model }) => {
  const requestToReturn: LlmSchema["request"] = {
    model: request.model,
    prompt: request.prompt,
    messages: [
      {
        role: "user",
        content: request.prompt || "",
        _type: "message",
      },
    ],
  };

  const llmSchema: LlmSchema = {
    request: requestToReturn,
    response: {
      model: model,
      messages: [
        {
          role: "assistant",
          content: "Image generated",
          _type: "image",
          image_url: response?.data?.[0]?.b64_json || "",
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
        {
          role: "user",
          content: request.prompt || "",
          _type: "message",
        },
        {
          role: "assistant",
          content: "Image generated",
          _type: "image",
          image_url: response?.data?.[0]?.b64_json || "",
        },
      ],
    },
  };
};
