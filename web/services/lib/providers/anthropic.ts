import {
  ChatCompletion,
  ChatCompletionCreateParams,
} from "openai/resources/chat";
import { Result } from "../../../lib/result";

export const fetchAnthropic = async (
  messages: ChatCompletionCreateParams[],
  temperature: number,
  model: string,
  maxTokens: number,
  anthropicAPIKey?: string,
  requestId?: string
) => {
  const completion = await fetch("/api/anthropic/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      requestId,
      temperature,
      model,
      maxTokens,
      anthropicAPIKey,
    }),
  }).then((res) => res.json() as Promise<Result<ChatCompletion, string>>);

  return completion;
};
