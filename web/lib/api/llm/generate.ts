import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { z } from "zod";

export interface GenerateParams {
  provider: string;
  model: string;
  messages: ChatCompletionMessageParam[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  schema?: object extends object ? z.ZodType<object> : never;
  signal?: AbortSignal;
  includeReasoning?: boolean;
  stream?: {
    onChunk: (chunk: string) => void;
    onCompletion: () => void;
  };
}

export type GenerateResponse = string | { content: string; reasoning: string };

export async function generate<T extends object | undefined = undefined>(
  params: GenerateParams
): Promise<T extends object ? T : GenerateResponse> {
  params.model = `${params.provider}/${params.model}`; // OpenRouter requires the model to be in the format of provider/model

  const response = await fetch("/api/llm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cancel": "0",
    },
    body: JSON.stringify({
      ...params,
      stream: !!params.stream,
    }),
  });

  if (params.stream) {
    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";
    let fullReasoning = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          params.stream?.onCompletion();
          break;
        }

        const chunk = decoder.decode(value);
        if (params.includeReasoning) {
          try {
            // Try to parse as JSON in case it's the final response
            const jsonResponse = JSON.parse(chunk);
            fullResponse = jsonResponse.content || fullResponse;
            fullReasoning = jsonResponse.reasoning || fullReasoning;
          } catch {
            // If not JSON, treat as reasoning chunk
            fullReasoning += chunk;
          }
          params.stream?.onChunk(chunk);
        } else {
          fullResponse += chunk;
          params.stream?.onChunk(chunk);
        }
      }

      return (
        params.includeReasoning
          ? { content: fullResponse, reasoning: fullReasoning }
          : fullResponse
      ) as T extends object ? T : GenerateResponse;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return (
          params.includeReasoning
            ? { content: fullResponse, reasoning: fullReasoning }
            : fullResponse
        ) as T extends object ? T : GenerateResponse;
      }
      throw error;
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to generate response");
  }

  return (
    params.includeReasoning
      ? { content: data.content, reasoning: data.reasoning }
      : data.content || data
  ) as T extends object ? T : GenerateResponse;
}
