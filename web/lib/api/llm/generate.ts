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

export const PROVIDER_MODELS = {
  // General Use Cases
  ANTHROPIC: {
    name: "Anthropic",
    openrouterDirectory: "anthropic",
    models: ["claude-3.5-haiku", "claude-3.5-sonnet", "claude-3-opus"],
  },
  OPENAI: {
    name: "OpenAI",
    openrouterDirectory: "openai",
    models: [
      "gpt-4o-mini",
      "gpt-4o",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-3.5-turbo",
      "chatgpt-4o-latest",
    ],
  },
  GOOGLE: {
    name: "Google",
    openrouterDirectory: "google",
    models: [
      "gemini-flash-1.5",
      "gemini-flash-1.5-8b",
      "gemini-pro-1.5",
      "gemma-2-27b-it",
      "gemma-2-9b-it",
    ],
  },
  META_LLAMA: {
    name: "Meta Llama",
    openrouterDirectory: "meta-llama",
    models: [
      "llama-3.1-70b-instruct",
      "llama-3.1-8b-instruct",
      "llama-3.1-405b-instruct",
      "llama-3.2-1b-instruct",
      "llama-3.2-3b-instruct",
      "llama-3.2-11b-vision-instruct",
      "llama-3.2-90b-vision-instruct",
      "llama-3-70b-instruct",
      "llama-3-8b-instruct",
      "llama-3-70b-instruct:nitro",
      "llama-3-8b-instruct:nitro",
      "llama-3-8b-instruct:extended",
      "llama-guard-2-8b",
      "llama-3.1-405b",
    ],
  },
  DEEPSEEK: {
    name: "DeepSeek",
    openrouterDirectory: "deepseek",
    models: ["deepseek-r1", "deepseek-chat"],
  },
  MISTRALAI: {
    name: "Mistral AI",
    openrouterDirectory: "mistral",
    models: [
      "mistral-nemo",
      "codestral-2501",
      "mixtral-8x7b-instruct",
      "ministral-8b",
      "ministral-3b",
      "mistral-7b-instruct",
      "mistral-large",
      "mistral-small",
      "codestral-mamba",
      "pixtral-12b",
      "pixtral-large-2411",
      "mistral-7b-instruct-v0.1",
      "mistral-7b-instruct-v0.3",
      "mistral-medium",
      "mistral-large-2411",
      "mistral-large-2407",
      "mixtral-8x7b-instruct:nitro",
      "mixtral-8x22b-instruct",
      "mistral-tiny",
    ],
  },
  QWEN: {
    name: "Qwen",
    openrouterDirectory: "qwen",
    models: [
      "qwen-2.5-72b-instruct",
      "qwen-2.5-7b-instruct",
      "qwen-2.5-coder-32b-instruct",
      "eva-qwen-2.5-72b",
    ],
  },
  X: {
    name: "X AI",
    openrouterDirectory: "x-ai",
    models: ["grok-2-1212", "grok-beta", "grok-2-vision-1212"],
  },
  PERPLEXITY: {
    name: "Perplexity",
    openrouterDirectory: "perplexity",
    models: [
      "llama-3.1-sonar-large-128k-online",
      "llama-3.1-sonar-large-128k-chat",
      "llama-3.1-sonar-huge-128k-online",
      "llama-3.1-sonar-small-128k-online",
    ],
  },
  COHERE: {
    name: "Cohere",
    openrouterDirectory: "cohere",
    models: ["command-r-plus", "command-r"],
  },
  AMAZON: {
    name: "Amazon",
    openrouterDirectory: "amazon",
    models: ["nova-lite-v1", "nova-micro-v1", "nova-pro-v1"],
  },
  MICROSOFT: {
    name: "Microsoft",
    openrouterDirectory: "microsoft",
    models: ["wizardlm-2-8x22b", "wizardlm-2-7b", "phi-4"],
  },
  NVIDIA: {
    name: "NVIDIA",
    openrouterDirectory: "nvidia",
    models: ["llama-3.1-nemotron-70b-instruct"],
  },
  // Finetunes and Roleplay Use Cases
  NOUSRESEARCH: {
    name: "Nous Research",
    openrouterDirectory: "nousresearch",
    models: [
      "hermes-3-llama-3.1-405b",
      "hermes-3-llama-3.1-70b",
      "hermes-2-pro-llama-3-8b",
      "nous-hermes-llama2-13b",
    ],
  },
  SAO10K: {
    name: "SAO10K",
    openrouterDirectory: "sao10k",
    models: [
      "l3-euryale-70b",
      "l3.1-euryale-70b",
      "l3-lunaris-8b",
      "l3.1-70b-hanami-x1",
    ],
  },
} as const;

export async function generate<T extends object | undefined = undefined>(
  params: GenerateParams
): Promise<T extends object ? T : GenerateResponse> {
  const providerConfig =
    PROVIDER_MODELS[params.provider as keyof typeof PROVIDER_MODELS];
  if (!providerConfig) {
    throw new Error(`Provider "${params.provider}" not found`);
  }
  // OpenRouter requires the model to be in the format of provider/model
  params.model = `${providerConfig.openrouterDirectory}/${params.model}`;

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
