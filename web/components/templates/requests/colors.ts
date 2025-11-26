import { ProviderName } from "@helicone-package/cost/providers/mappings";
import { ModelProviderName } from "@helicone-package/cost/models/providers";
import { Provider } from "@helicone-package/llm-mapper/types";
import { AuthorName } from "@helicone-package/cost/models/types";
import { registry } from "@helicone-package/cost/models/registry";

export const colourPillStyles = {
  purple:
    "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:ring-purple-800",
  teal: "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-900 dark:text-teal-300 dark:ring-teal-800",
  blue: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:ring-blue-800",
  orange:
    "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:ring-orange-800",
  yellow:
    "bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:ring-yellow-800",
  indigo:
    "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:ring-indigo-800",
  green:
    "bg-green-50 text-green-700 ring-green-200 dark:bg-green-900 dark:text-green-300 dark:ring-green-800",
  pink: "bg-pink-50 text-pink-700 ring-pink-200 dark:bg-pink-900 dark:text-pink-300 dark:ring-pink-800",
  gray: "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-800",
  red: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-900 dark:text-red-300 dark:ring-red-800",
  emerald:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:ring-emerald-800",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-900 dark:text-cyan-300 dark:ring-cyan-800",
} as const;

export type ColorKey = keyof typeof colourPillStyles;

const authorColorMapping: Partial<Record<AuthorName, ColorKey>> = {
  anthropic: "orange",
  openai: "purple",
  google: "teal",
  "meta-llama": "blue",
  microsoft: "cyan",
  mistral: "pink",
  deepseek: "red",
  xai: "gray",
  alibaba: "yellow",
  qwen: "yellow",
  amazon: "cyan",
  nvidia: "green",
  moonshotai: "indigo",
  perplexity: "yellow",
  passthrough: "gray",
};

const providerNameColorMapping: Partial<Record<ProviderName, ColorKey>> = {
  OPENAI: "purple",
  AZURE: "purple",
  ANTHROPIC: "orange",
  GOOGLE: "teal",
  LLAMA: "blue",
  NVIDIA: "green",
  GROQ: "indigo",
  TOGETHER: "indigo",
  ANYSCALE: "indigo",
  FIREWORKS: "indigo",
  DEEPINFRA: "indigo",
  AWS: "cyan",
  BEDROCK: "cyan",
  CLOUDFLARE: "cyan",
  VERCEL: "cyan",
  OPENROUTER: "yellow",
  PERPLEXITY: "yellow",
  MISTRAL: "pink",
  COHERE: "emerald",
  DEEPSEEK: "red",
  X: "gray",
  LOCAL: "gray",
  HELICONE: "gray",
  AMDBARTEK: "gray",
  "2YFV": "gray",
  LEMONFOX: "gray",
  WISDOMINANUTSHELL: "gray",
  QSTASH: "gray",
  FIRECRAWL: "gray",
  AVIAN: "gray",
  NEBIUS: "gray",
  NOVITA: "gray",
  OPENPIPE: "gray",
  CHUTES: "gray",
};

const modelProviderNameColorMapping: Partial<
  Record<ModelProviderName, ColorKey>
> = {
  openai: "purple",
  azure: "purple",
  anthropic: "orange",
  "google-ai-studio": "teal",
  vertex: "teal",
  bedrock: "cyan",
  groq: "indigo",
  deepinfra: "indigo",
  perplexity: "indigo",
  openrouter: "yellow",
  deepseek: "red",
  xai: "gray",
  mistral: "pink",
};

// search AI Gateway registry for model author
export function getModelAuthor(modelName: string): AuthorName | null {
  try {
    const allModelsResult = registry.getAllModelsWithIds();
    if (allModelsResult.error || !allModelsResult.data) {
      return null;
    }

    const allModels = allModelsResult.data;
    const modelConfig = allModels[modelName as keyof typeof allModels];
    return modelConfig?.author || null;
  } catch (error) {
    return null;
  }
}

export function getAuthorColor(author: AuthorName): ColorKey {
  return authorColorMapping[author] || "blue";
}

export function getProviderColor(provider: Provider): ColorKey {
  if (provider === "CUSTOM") {
    return "gray";
  }

  if (provider in providerNameColorMapping) {
    return providerNameColorMapping[provider as ProviderName] || "blue";
  }

  if (provider in modelProviderNameColorMapping) {
    return (
      modelProviderNameColorMapping[provider as ModelProviderName] || "blue"
    );
  }

  return "blue";
}
