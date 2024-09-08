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
  const requestBody = request.request_body || {};
  const generateConfig = requestBody.generation_config || {};
  const contents = requestBody.contents;
  const messages = Array.isArray(contents)
    ? contents
    : [contents].filter(Boolean);

  const requestMessages = messages
    .map((content: any) => {
      if (!content) return [];

      const parts = Array.isArray(content.parts)
        ? content.parts
        : [content.parts].filter(Boolean);
      const textParts = parts.filter(
        (part: any) => part && typeof part.text === "string"
      );

      return textParts.map((part: any) => ({
        role: content.role || "user",
        content: part.text,
      }));
    })
    .flat();

  const responseBody = Array.isArray(request.response_body)
    ? request.response_body
    : [request.response_body].filter(Boolean);

  const combinedContent = responseBody
    .map((response: any) => {
      if (!response || !Array.isArray(response.candidates)) return "";

      return response.candidates
        .map((candidate: any) => {
          if (!candidate) return "";

          const contents = Array.isArray(candidate.content)
            ? candidate.content
            : [candidate.content].filter(Boolean);

          return contents
            .map((content: any) => {
              if (!content) return "";

              const parts = Array.isArray(content.parts)
                ? content.parts
                : [content.parts].filter(Boolean);

              return parts
                .map((part: any) =>
                  part && typeof part.text === "string" ? part.text : ""
                )
                .filter(Boolean)
                .join("");
            })
            .join("");
        })
        .join("");
    })
    .join("");

  const functionCall = responseBody
    .map((response: any) => {
      if (!response || !Array.isArray(response.candidates)) return null;

      return response.candidates
        .map((candidate: any) => {
          if (!candidate) return null;

          const contents = Array.isArray(candidate.content)
            ? candidate.content
            : [candidate.content].filter(Boolean);

          return contents
            .map((content: any) => {
              if (!content) return null;

              const parts = Array.isArray(content.parts)
                ? content.parts
                : [content.parts].filter(Boolean);

              return parts.find((part: any) => part && part.functionCall)
                ?.functionCall;
            })
            .find((funcCall: any) => funcCall);
        })
        .find((funcCall: any) => funcCall);
    })
    .find((funcCall: any) => funcCall);

  const firstContent = responseBody[0]?.candidates?.[0]?.content;

  const responseMessages =
    combinedContent || functionCall
      ? {
          role: firstContent?.role ?? "model",
          content: (combinedContent as any) || undefined,
          function_call: functionCall
            ? {
                name: functionCall.name,
                arguments: JSON.stringify(functionCall.args) as any,
              }
            : undefined,
        }
      : null;

  const error = responseBody.find((item: any) => item?.error)?.error;

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
      error: error
        ? {
            message: error?.message,
            code: error?.code,
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
  const messages = Array.isArray(requestBody?.contents)
    ? requestBody.contents
    : [requestBody.contents];
  const requestMessages = messages
    .map((content: any) => {
      const partsArray = Array.isArray(content?.parts)
        ? content.parts
        : [content.parts];

      const textParts = partsArray?.filter((part: any) => part.text);

      return textParts.map((part: any) => ({
        role: content.role ?? "user",
        content: part.text,
      }));
    })
    .flat();

  const responseBody = Array.isArray(request.response_body)
    ? request.response_body
    : [request.response_body];

  const combinedContent = responseBody
    .map((response: any) =>
      response.candidates
        ?.map((candidate: any) => {
          const contents = Array.isArray(candidate.content)
            ? candidate.content
            : [candidate.content];

          return contents
            .map((content: any) => {
              const partsArray = Array.isArray(content?.parts)
                ? content.parts
                : [content?.parts];

              return partsArray
                .map((part: any) => part?.text || "")
                .filter((text: string) => text)
                .join("");
            })
            .join("");
        })
        .join("")
    )
    .join("");

  const functionCall = responseBody
    .map((response: any) =>
      response.candidates
        ?.map((candidate: any) => {
          const contents = Array.isArray(candidate.content)
            ? candidate.content
            : [candidate.content];

          return contents
            .map((content: any) => {
              const partsArray = Array.isArray(content?.parts)
                ? content.parts
                : [content?.parts];

              return partsArray.find((part: any) => part?.functionCall)
                ?.functionCall;
            })
            .find((funcCall: any) => funcCall);
        })
        .find((funcCall: any) => funcCall)
    )
    .find((funcCall: any) => funcCall);

  const firstContent = responseBody[0]?.candidates?.[0]?.content;

  const responseMessages =
    combinedContent || functionCall
      ? {
          role: firstContent?.role ?? "model",
          content: (combinedContent as any) || undefined,
          function_call: functionCall
            ? {
                name: functionCall.name,
                arguments: JSON.stringify(functionCall.args) as any,
              }
            : undefined,
        }
      : null;

  const error = responseBody.find((item: any) => item?.error)?.error;

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
      error: error
        ? {
            message: error?.message,
            code: error?.code,
          }
        : null,
      model: model,
    },
  };

  return schema;
}
