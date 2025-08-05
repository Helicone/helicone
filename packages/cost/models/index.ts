/**
 * Model Registry Index
 * Auto-generated on: 2025-08-05T01:21:31.504Z
 *
 * This file combines all author data from the ./authors/ directory
 */

// Model imports
import amazonModels from "./authors/amazon/models.json";
import anthropicModels from "./authors/anthropic/models.json";
import cohereModels from "./authors/cohere/models.json";
import deepseekModels from "./authors/deepseek/models.json";
import googleModels from "./authors/google/models.json";
import meta_llamaModels from "./authors/meta-llama/models.json";
import mistralaiModels from "./authors/mistralai/models.json";
import moonshotaiModels from "./authors/moonshotai/models.json";
import openaiModels from "./authors/openai/models.json";
import perplexityModels from "./authors/perplexity/models.json";
import qwenModels from "./authors/qwen/models.json";
import x_aiModels from "./authors/x-ai/models.json";

// Endpoint imports
import amazonEndpoints from "./authors/amazon/endpoints.json";
import anthropicEndpoints from "./authors/anthropic/endpoints.json";
import cohereEndpoints from "./authors/cohere/endpoints.json";
import deepseekEndpoints from "./authors/deepseek/endpoints.json";
import googleEndpoints from "./authors/google/endpoints.json";
import meta_llamaEndpoints from "./authors/meta-llama/endpoints.json";
import mistralaiEndpoints from "./authors/mistralai/endpoints.json";
import moonshotaiEndpoints from "./authors/moonshotai/endpoints.json";
import openaiEndpoints from "./authors/openai/endpoints.json";
import perplexityEndpoints from "./authors/perplexity/endpoints.json";
import qwenEndpoints from "./authors/qwen/endpoints.json";
import x_aiEndpoints from "./authors/x-ai/endpoints.json";

// Metadata imports
import amazonMetadata from "./authors/amazon/metadata.json";
import anthropicMetadata from "./authors/anthropic/metadata.json";
import cohereMetadata from "./authors/cohere/metadata.json";
import deepseekMetadata from "./authors/deepseek/metadata.json";
import googleMetadata from "./authors/google/metadata.json";
import meta_llamaMetadata from "./authors/meta-llama/metadata.json";
import microsoftMetadata from "./authors/microsoft/metadata.json";
import mistralaiMetadata from "./authors/mistralai/metadata.json";
import moonshotaiMetadata from "./authors/moonshotai/metadata.json";
import nvidiaMetadata from "./authors/nvidia/metadata.json";
import openaiMetadata from "./authors/openai/metadata.json";
import perplexityMetadata from "./authors/perplexity/metadata.json";
import qwenMetadata from "./authors/qwen/metadata.json";
import x_aiMetadata from "./authors/x-ai/metadata.json";

import modelVersions from "./model-versions.json";

export interface Model {
  id: string;
  name: string;
  author: string;
  description: string;
  contextLength: number;
  maxOutputTokens: number | null;
  created: string;
  modality: string;
  tokenizer: string;
}

export interface Endpoint {
  name?: string;
  provider: string;
  providerModelId?: string;
  model?: string;
  tag: string;
  status?: number;
  pricing: {
    prompt: number;
    completion: number;
    image?: number;
    cacheRead?: number | null;
    cacheWrite?: number | null;
  };
  contextLength: number;
  maxCompletionTokens: number | null;
  supportedParameters: string[];
}

export interface Author {
  slug: string;
  name: string;
  models: string[];
}

// Combine all models
export const models: Record<string, Model> = {
  ...amazonModels,
  ...anthropicModels,
  ...cohereModels,
  ...deepseekModels,
  ...googleModels,
  ...meta_llamaModels,
  ...mistralaiModels,
  ...moonshotaiModels,
  ...openaiModels,
  ...perplexityModels,
  ...qwenModels,
  ...x_aiModels,
};

// Combine all endpoints
export const endpoints: Record<string, Endpoint[]> = {
  ...amazonEndpoints,
  ...anthropicEndpoints,
  ...cohereEndpoints,
  ...deepseekEndpoints,
  ...googleEndpoints,
  ...meta_llamaEndpoints,
  ...mistralaiEndpoints,
  ...moonshotaiEndpoints,
  ...openaiEndpoints,
  ...perplexityEndpoints,
  ...qwenEndpoints,
  ...x_aiEndpoints,
};

// Build authors map from metadata
export const authors: Record<string, Author> = {
  [amazonMetadata.slug]: {
    slug: amazonMetadata.slug,
    name: amazonMetadata.name,
    models: Object.keys(amazonModels),
  },
  [anthropicMetadata.slug]: {
    slug: anthropicMetadata.slug,
    name: anthropicMetadata.name,
    models: Object.keys(anthropicModels),
  },
  [cohereMetadata.slug]: {
    slug: cohereMetadata.slug,
    name: cohereMetadata.name,
    models: Object.keys(cohereModels),
  },
  [deepseekMetadata.slug]: {
    slug: deepseekMetadata.slug,
    name: deepseekMetadata.name,
    models: Object.keys(deepseekModels),
  },
  [googleMetadata.slug]: {
    slug: googleMetadata.slug,
    name: googleMetadata.name,
    models: Object.keys(googleModels),
  },
  [meta_llamaMetadata.slug]: {
    slug: meta_llamaMetadata.slug,
    name: meta_llamaMetadata.name,
    models: Object.keys(meta_llamaModels),
  },
  [microsoftMetadata.slug]: {
    slug: microsoftMetadata.slug,
    name: microsoftMetadata.name,
    models: [],
  },
  [mistralaiMetadata.slug]: {
    slug: mistralaiMetadata.slug,
    name: mistralaiMetadata.name,
    models: Object.keys(mistralaiModels),
  },
  [moonshotaiMetadata.slug]: {
    slug: moonshotaiMetadata.slug,
    name: moonshotaiMetadata.name,
    models: Object.keys(moonshotaiModels),
  },
  [nvidiaMetadata.slug]: {
    slug: nvidiaMetadata.slug,
    name: nvidiaMetadata.name,
    models: [],
  },
  [openaiMetadata.slug]: {
    slug: openaiMetadata.slug,
    name: openaiMetadata.name,
    models: Object.keys(openaiModels),
  },
  [perplexityMetadata.slug]: {
    slug: perplexityMetadata.slug,
    name: perplexityMetadata.name,
    models: Object.keys(perplexityModels),
  },
  [qwenMetadata.slug]: {
    slug: qwenMetadata.slug,
    name: qwenMetadata.name,
    models: Object.keys(qwenModels),
  },
  [x_aiMetadata.slug]: {
    slug: x_aiMetadata.slug,
    name: x_aiMetadata.name,
    models: Object.keys(x_aiModels),
  },
};

// Export registry
export const registry = {
  models,
  endpoints,
  authors,
  modelVersions: modelVersions as Record<string, string[]>,
};

// Helper functions
export function getModel(modelKey: string): Model | undefined {
  return registry.models[modelKey];
}

export function getEndpoints(modelKey: string): Endpoint[] {
  return registry.endpoints[modelKey] || [];
}

export function getAuthor(authorSlug: string): Author | undefined {
  return registry.authors[authorSlug];
}

export function getModelVersions(baseModel: string): string[] {
  return registry.modelVersions[baseModel] || [];
}
