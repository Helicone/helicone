import { ModelProviderName } from "./providers";

export interface AuthorMetadata {
  modelCount: number;
  supported: boolean;
  name?: string;
  slug?: string;
  description?: string;
  website?: string;
  apiUrl?: string;
}

export const AUTHORS = [
  "anthropic",
  "openai",
  "google",
  "meta-llama",
  "mistral",
  "amazon",
  "microsoft",
  "nvidia",
  "deepseek",
  "qwen",
  "xai",
  "moonshotai",
  "perplexity",
  "alibaba",
  "zai",
  "baidu",
  "neuronpool",
  "nomic",
] as const;
