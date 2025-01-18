import OpenAI from "openai";
import { z } from "zod";

export interface GenerateParams {
  model: string;
  messages: OpenAI.ChatCompletionMessageParam[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  schema?: object extends object ? z.ZodType<object> : never;
  signal?: AbortSignal;
  stream?: {
    onChunk: (chunk: string) => void;
    onCompletion: () => void;
  };
}

export async function generate<T extends object | undefined = undefined>(
  params: GenerateParams
): Promise<T extends object ? T : string> {
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

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          params.stream?.onCompletion();
          break;
        }

        const chunk = decoder.decode(value);
        fullResponse += chunk;
        params.stream?.onChunk(chunk);
      }

      return fullResponse as T extends object ? T : string;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return fullResponse as T extends object ? T : string;
      }
      throw error;
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to generate response");
  }

  return (data.content || data) as T extends object ? T : string;
}
