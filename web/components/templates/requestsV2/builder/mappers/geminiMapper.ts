import { LlmSchema } from "../../../../../lib/api/models/requestResponseModel";
import { HeliconeRequest } from "../../../../../lib/api/request/request";
import { components } from "../../../../../lib/clients/jawnTypes/public";

export const getModelFromPath = (path: string) => {
  const regex1 = /\/engines\/([^/]+)/;
  const regex2 = /models\/([^/:]+)/;

  let match = path.match(regex1);

  if (!match) {
    match = path.match(regex2);
  }

  if (match && match[1]) {
    return match[1];
  } else {
    return undefined;
  }
};

export function mapGeminiPro(
  request: HeliconeRequest,
  model: string
): LlmSchema {
  const requestBody = request.request_body;
  const generateConfig = requestBody?.generation_config;
  const messages = Array.isArray(requestBody.contents)
    ? requestBody.contents
    : [requestBody.contents];
  const requestMessages = messages
    .map((content: any) => {
      const partsArray = Array.isArray(content.parts)
        ? content.parts
        : [content.parts];

      const textParts = partsArray?.filter((part: any) => part.text);

      return textParts.map((part: any) => ({
        role: content.role ?? "user",
        content: part.text,
      }));
    })
    .flat();

  const responseBody =
    Array.isArray(request.response_body) && request.response_body.length > 0
      ? request.response_body[0]
      : request.response_body;

  const firstCandidate = responseBody?.candidates?.find((candidate: any) => {
    if (!candidate?.content) {
      console.log("No content found in candidate", candidate);
      return false;
    }

    const contents = Array.isArray(candidate.content)
      ? candidate.content
      : [candidate.content];

    return contents.some((content: any) =>
      Array.isArray(content.parts)
        ? content.parts.some((part: any) => part.text || part.functionCall)
        : content.parts?.text
    );
  });

  const firstContent = Array.isArray(firstCandidate?.content)
    ? firstCandidate.content.find((content: any) => content.parts)
    : firstCandidate?.content;

  const firstPart = Array.isArray(firstContent?.parts)
    ? firstContent.parts.find((part: any) => part.text || part.functionCall)
    : firstContent?.parts;

  const responseMessages = firstPart
    ? {
        role: firstContent.role ?? "user",
        content: firstPart.text,
        function_call: firstPart.functionCall
          ? {
              name: firstPart.functionCall?.name,
              arguments: firstPart.functionCall?.args,
            }
          : undefined,
      }
    : null;

  const schema: LlmSchema = {
    request: {
      llm_type: "chat",
      model: model,
      prompt: null,
      max_tokens: generateConfig?.maxOutputTokens,
      temperature: generateConfig?.temperature,
      top_p: generateConfig?.topP,
      n: generateConfig?.candidateCount,
      stream: false,
      stop: generateConfig?.stopSequences,
      presence_penalty: 0,
      frequency_penalty: 0,
      logprobs: null,
      best_of: null,
      logit_bias: null,
      user: null,
      messages: requestMessages,
    },
    response: {
      message: responseMessages,
      error: responseBody?.error
        ? {
            message: responseBody?.error?.message,
            code: responseBody?.error?.code,
          }
        : null,
      model: model,
    },
  };

  return schema;
}

export function mapGeminiProJawn(
  request: HeliconeRequest,
  model: string
): components["schemas"]["LlmSchema"] {
  const requestBody = request.request_body;
  const generateConfig = requestBody?.generation_config;
  const messages = Array.isArray(requestBody.contents)
    ? requestBody.contents
    : [requestBody.contents];
  const requestMessages = messages
    .map((content: any) => {
      const partsArray = Array.isArray(content.parts)
        ? content.parts
        : [content.parts];

      const textParts = partsArray?.filter((part: any) => part.text);

      return textParts.map((part: any) => ({
        role: content.role ?? "user",
        content: part.text,
      }));
    })
    .flat();

  const responseBody =
    Array.isArray(request.response_body) && request.response_body.length > 0
      ? request.response_body[0]
      : request.response_body;

  const firstCandidate = responseBody?.candidates?.find((candidate: any) => {
    if (!candidate?.content) {
      console.log("No content found in candidate", candidate);
      return false;
    }

    const contents = Array.isArray(candidate.content)
      ? candidate.content
      : [candidate.content];

    // Updated to handle undefined properties
    return contents.some((content: any) =>
      Array.isArray(content.parts)
        ? content.parts.some((part: any) => part.text || part.functionCall)
        : content.parts?.text
    );
  });

  const firstContent = Array.isArray(firstCandidate?.content)
    ? firstCandidate.content.find((content: any) => content.parts)
    : firstCandidate?.content;

  const firstPart = Array.isArray(firstContent?.parts)
    ? firstContent.parts.find((part: any) => part.text || part.functionCall)
    : firstContent?.parts;

  const responseMessages = firstPart
    ? {
        role: firstContent.role ?? "user",
        content: firstPart.text,
        function_call: firstPart.functionCall
          ? {
              name: firstPart.functionCall?.name,
              arguments: firstPart.functionCall?.args,
            }
          : undefined,
      }
    : null;

  const schema: components["schemas"]["LlmSchema"] = {
    request: {
      llm_type: "chat",
      model: model,
      prompt: null,
      max_tokens: generateConfig?.maxOutputTokens,
      temperature: generateConfig?.temperature,
      top_p: generateConfig?.topP,
      n: generateConfig?.candidateCount,
      stream: false,
      stop: generateConfig?.stopSequences,
      presence_penalty: 0,
      frequency_penalty: 0,
      logprobs: null,
      best_of: null,
      logit_bias: null,
      user: null,
      messages: requestMessages,
    },
    response: {
      message: responseMessages,
      error: responseBody?.error
        ? {
            message: responseBody?.error?.message,
            code: responseBody?.error?.code,
          }
        : null,
      model: model,
    },
  };

  return schema;
}
