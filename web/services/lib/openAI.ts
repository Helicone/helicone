import {
  ChatCompletion,
  ChatCompletionCreateParams,
} from "openai/resources/chat";
import { Result } from "../../lib/result";

export const fetchOpenAI = async (
  messages: ChatCompletionCreateParams[],
  temperature: number,
  model: string,
  maxTokens: number,
  requestId?: string
) => {
  const completion = await fetch("/api/open_ai/chat", {
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
    }),
  }).then((res) => res.json() as Promise<Result<ChatCompletion, string>>);

  return completion;
};
