import { LlmSchema } from "../../types";

export function mapGeminiPro({
  requestBody,
  model,
  responseBody,
}: {
  requestBody: any;
  model: string;
  responseBody: any;
}): LlmSchema {
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

  responseBody = Array.isArray(responseBody)
    ? responseBody
    : [responseBody].filter(Boolean);

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
      messages: requestMessages,
    },
    response: {
      messages: [
        {
          role: responseMessages?.role,
          content: responseMessages?.content,
          tool_calls: responseMessages?.function_call
            ? [responseMessages?.function_call]
            : undefined,
          _type: responseMessages?.function_call ? "function" : "message",
        },
      ],
      error: error
        ? {
            heliconeMessage: {
              message: error?.message,
              code: error?.code,
            },
          }
        : undefined,
      model: model,
    },
  };

  return schema;
}
