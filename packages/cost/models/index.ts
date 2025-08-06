/**
 * Model Registry Index
 *
 * This file combines all author data from the ./authors/ directory
 */

import {
  providers,
  getProvider,
  buildEndpointUrl,
  isDetailedEndpoint,
  type ProviderConfig,
  type ProviderEndpoint,
  buildBedrockModelId,
} from "./providers";

import {
  type Model,
  type ModelName,
  type ModelEndpoint,
  type AuthorData,
  type Author as AuthorName,
  type Provider,
} from "./types";

// Author imports (TypeScript)
import anthropic from "./authors/anthropic";
import amazon from "./authors/amazon";
import cohere from "./authors/cohere";
import deepseek from "./authors/deepseek";
import google from "./authors/google";
import metaLlama from "./authors/meta-llama";
import mistralai from "./authors/mistralai";
import moonshotai from "./authors/moonshotai";
import nvidia from "./authors/nvidia";
import openai from "./authors/openai";
import perplexity from "./authors/perplexity";
import xAi from "./authors/x-ai";

import modelVersions from "./model-versions";

// Re-export types
export {
  type Model,
  type ModelName,
  type ModelEndpoint,
  type AuthorMetadata,
  type AuthorData,
  type ModelPricing,
  type Author as AuthorName,
  type Provider,
} from "./types";

// Re-export ProviderConfig as EndpointDef for backward compatibility
export type EndpointDef = ProviderConfig;

// Legacy Author interface for backward compatibility
export interface Author {
  modelCount: number;
  supported: boolean;
  models: string[];
}

// Collect all author data
const authorData: Record<string, AuthorData> = {
  anthropic,
  amazon,
  cohere,
  deepseek,
  google,
  "meta-llama": metaLlama,
  mistralai,
  moonshotai,
  nvidia,
  openai,
  perplexity,
  "x-ai": xAi,
};

// Combine all models from author data
export const models: Partial<Record<ModelName, Model>> = Object.values(
  authorData
).reduce((acc, author) => ({ ...acc, ...author.models }), {});

// Combine all endpoints from author data
export const endpoints: Partial<Record<ModelName, ModelEndpoint[]>> =
  Object.values(authorData).reduce(
    (acc, author) => ({ ...acc, ...author.endpoints }),
    {}
  );

// Build legacy authors map for backward compatibility
export const authors: Partial<Record<AuthorName, Author>> = Object.entries(
  authorData
).reduce(
  (acc, [key, data]) => ({
    ...acc,
    [key]: {
      ...data.metadata,
      models: Object.keys(data.models),
    },
  }),
  {}
);

// Export registry
export const registry = {
  models,
  endpoints,
  authors,
  authorData, // Also expose the full author data
  modelVersions,
  endpointDefs: providers,
  providers,
};

// Helper functions with proper typing
export function getModel(modelKey: ModelName): Model | undefined {
  return registry.models[modelKey];
}

export function getEndpoints(modelKey: ModelName): ModelEndpoint[] {
  return registry.endpoints[modelKey] || [];
}

export function getAuthor(authorSlug: AuthorName): Author | undefined {
  return registry.authors[authorSlug];
}

export function getAuthorData(authorSlug: AuthorName): AuthorData | undefined {
  return registry.authorData[authorSlug];
}

export function getModelVersions(baseModel: string): string[] {
  return registry.modelVersions[baseModel] || [];
}

export function getEndpointDef(provider: Provider): EndpointDef | undefined {
  return getProvider(provider);
}

// Re-export provider utilities
export {
  getProvider,
  buildEndpointUrl,
  buildBedrockModelId,
  isDetailedEndpoint,
  type ProviderConfig,
  type ProviderEndpoint,
};
