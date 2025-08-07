/**
 * Model Registry Index
 *
 * This file combines all author data from the ./authors/ directory
 */

import { providers } from "./providers";

import {
  type Model,
  type ModelName,
  type ModelEndpoint,
  type AuthorData,
  type AuthorName,
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

// Re-export types
export {
  type Model,
  type ModelName,
  type ModelEndpoint,
  type AuthorMetadata,
  type AuthorData,
  type ModelPricing,
  type AuthorName,
  type Provider,
} from "./types";

// Author info interface
export interface AuthorInfo {
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
export const models: Record<ModelName, Model> = Object.values(
  authorData
).reduce((acc, author) => ({ ...acc, ...author.models }), {}) as Record<
  ModelName,
  Model
>;

// Combine all endpoints from author data
export const endpoints: Record<ModelName, ModelEndpoint[]> = Object.values(
  authorData
).reduce((acc, author) => ({ ...acc, ...author.endpoints }), {}) as Record<
  ModelName,
  ModelEndpoint[]
>;

// Build authors info map
export const authors: Record<AuthorName, AuthorInfo> = Object.entries(
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
) as Record<AuthorName, AuthorInfo>;

// Export registry
export const registry = {
  models,
  endpoints,
  authors,
  authorData,
  providers,
};

// Helper functions with proper typing
export function getModel(modelKey: ModelName): Model {
  return registry.models[modelKey];
}

export function getEndpoints(modelKey: ModelName | string): ModelEndpoint[] {
  return modelKey in registry.endpoints
    ? registry.endpoints[modelKey as ModelName]
    : [];
}

export function getEndpoint(
  modelKey: ModelName | string,
  provider: ProviderName
): ModelEndpoint | undefined {
  const endpoints = getEndpoints(modelKey);
  return endpoints.find((endpoint) => endpoint.provider === provider);
}

export function getAuthor(authorSlug: AuthorName): AuthorInfo {
  return registry.authors[authorSlug];
}

export function getAuthorData(authorSlug: AuthorName): AuthorData {
  return registry.authorData[authorSlug];
}

/**
 * Get provider configuration
 */
export function getProvider(providerId: string): ProviderConfig | undefined {
  return providerId in providers
    ? providers[providerId as ProviderName]
    : undefined;
}

/**
 * Build model ID for any provider using their specific logic
 */
export function buildModelId(
  endpoint: ModelEndpoint,
  options?: {
    region?: string;
    crossRegion?: boolean;
    projectId?: string;
  }
): string {
  const provider = getProvider(endpoint.provider as ProviderName);
  if (!provider?.buildModelId) {
    return endpoint.providerModelId || "";
  }
  return provider.buildModelId(endpoint, options);
}

/**
 * Build complete URL for any provider
 */
export function buildEndpointUrl(
  endpoint: ModelEndpoint,
  options?: {
    region?: string;
    crossRegion?: boolean;
    projectId?: string;
    deploymentName?: string;
    resourceName?: string;
  }
): string | null {
  const provider = getProvider(endpoint.provider as ProviderName);
  if (!provider) return null;

  if (provider.buildUrl) {
    return provider.buildUrl(provider.baseUrl, endpoint, options);
  }

  // Fallback to simple URL construction
  return `${provider.baseUrl}/v1/chat/completions`;
}

// Import provider types
import {
  type ProviderConfig,
  type ProviderEndpoint,
  type ProviderName,
} from "./providers";

// Re-export types
export type { ProviderConfig, ProviderEndpoint } from "./providers";
