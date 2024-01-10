import {
  ChatCompletionRequestMessage,
  CreateChatCompletionResponse,
} from "openai";
import { Result } from "../../lib/result";

export const fetchOpenAI = async (
  messages: ChatCompletionRequestMessage[],
  requestId: string,
  temperature: number,
  model: string,
  maxTokens: number
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
  }).then(
    (res) => res.json() as Promise<Result<CreateChatCompletionResponse, string>>
  );

  return completion;
};
