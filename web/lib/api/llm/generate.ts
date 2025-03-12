import { modelMapping } from "packages/cost/unified/models";
import { Provider } from "packages/cost/unified/types";
import { Message } from "packages/llm-mapper/types";
import { z } from "zod";

export interface GenerateParams {
  provider: Provider;
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  schema?: object extends object ? z.ZodType<object> : never;
  signal?: AbortSignal;
  includeReasoning?: boolean;
  reasoning_effort?: "low" | "medium" | "high";
  stream?: {
    onChunk: (chunk: string) => void;
    onCompletion: () => void;
  };
}
export type GenerateResponse = string | { content: string; reasoning: string };
export async function generate<T extends object | undefined = undefined>(
  params: GenerateParams
): Promise<T extends object ? T : GenerateResponse> {
  // Find the OpenRouter model string for the given model
  let openRouterModelString = params.model;

  // Search through all creators and their models to find the OpenRouter model string
  let foundMatch = false;
  for (const creator of Object.keys(modelMapping) as Array<
    keyof typeof modelMapping
  >) {
    if (foundMatch) break;
    for (const modelName of Object.keys(modelMapping[creator])) {
      const modelConfig = modelMapping[creator][modelName];

      // Find the provider model that matches our model string
      const providerModel = modelConfig.providers.find(
        (pm) => pm.modelString === params.model
      );

      if (providerModel) {
        // If we found a match, look for the OpenRouter model string
        const openRouterProvider = modelConfig.providers.find(
          (pm) => pm.provider === "OPENROUTER"
        );

        if (openRouterProvider) {
          openRouterModelString = openRouterProvider.modelString;
          foundMatch = true;
          break;
        }
      }
    }
  }

  // Always use OpenRouter as the provider
  const modifiedParams = {
    ...params,
    provider: "OPENROUTER" as Provider,
    model: openRouterModelString,
  };

  const response = await fetch("/api/llm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cancel": "0",
    },
    body: JSON.stringify({
      ...modifiedParams,
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
