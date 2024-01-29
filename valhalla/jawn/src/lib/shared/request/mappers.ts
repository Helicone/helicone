import { LlmSchema } from "../requestResponseModel";
import { HeliconeRequest } from "./request";

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

      const textParts = partsArray.filter((part: any) => part.text);

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
    const contents = Array.isArray(candidate.content)
      ? candidate.content
      : [candidate.content];
    return contents.some((content: any) =>
      Array.isArray(content.parts)
        ? content.parts.some((part: any) => part.text)
        : content.parts.text
    );
  });

  const firstContent = Array.isArray(firstCandidate?.content)
    ? firstCandidate.content.find((content: any) => content.parts)
    : firstCandidate?.content;
  const firstPart = Array.isArray(firstContent?.parts)
    ? firstContent.parts.find((part: any) => part.text)
    : firstContent?.parts;

  const responseMessages = firstPart
    ? { role: firstContent.role ?? "user", content: firstPart.text }
    : {};

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

  console.log(`Mapped request to schema: ${JSON.stringify(schema)}`);
  return schema;
}
