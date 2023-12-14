import {
  ChatCompletionRequestMessage,
  CreateChatCompletionResponse,
} from "openai";
import { Result } from "../../lib/result";

/**
 * Fetches chat completion from OpenAI API.
 * @param messages - Array of chat completion request messages.
 * @param requestId - Unique identifier for the request.
 * @param temperature - Controls the randomness of the output. Higher values make output more random.
 * @param model - The model to use for chat completion.
 * @param maxTokens - The maximum number of tokens in the generated response.
 * @returns A promise that resolves to the chat completion response.
 */
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
