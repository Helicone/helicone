/**
 * Model version mappings
 * Maps base model names to their versioned variants
 */

// If we want to create a union type of all model IDs from the author files,
// we would need to import all models and extract their keys.
// However, this creates a circular dependency risk and makes the type system
// more complex. For now, we'll keep it flexible with Record<string, string[]>
// since model versions can be added independently of main model definitions.

export type ModelVersionMap = Record<string, string[]>;

// Import ModelName for type safety
import { type ModelName } from "./types";

// Define base models that have versions
// Note: These are a subset of ModelName that have versioned variants
export type BaseModelWithVersions = keyof typeof modelVersions;

// All versioned model names
export type VersionedModelName =
  | "codestral-2501"
  | "codestral-2508"
  | "qwen3-30b-a3b-instruct-2507"
  | "qwen3-235b-a22b-thinking-2507"
  | "qwen3-235b-a22b-2507"
  | "magistral-small-2506"
  | "magistral-medium-2506"
  | "deepseek-r1-0528"
  | "devstral-small-2505"
  | "deepseek-chat-v3-0324"
  | "r1-1776"
  | "mistral-small-24b-instruct-2501"
  | "grok-2-vision-1212"
  | "grok-2-1212"
  | "command-r7b-12-2024"
  | "mistral-large-2407"
  | "mistral-large-2411"
  | "pixtral-large-2411"
  | "claude-3.5-haiku-20241022"
  | "command-r-plus-08-2024"
  | "command-r-08-2024"
  | "claude-3.5-sonnet-20240620"
  | "command-r-plus-04-2024"
  | "command-r-03-2024"
  | "gpt-3.5-turbo-0613"
  | "gpt-4-0314";

export const modelVersions: ModelVersionMap = {
  codestral: ["codestral-2501", "codestral-2508"],
  "qwen3-30b-a3b-instruct": ["qwen3-30b-a3b-instruct-2507"],
  "qwen3-235b-a22b-thinking": ["qwen3-235b-a22b-thinking-2507"],
  "qwen3-235b-a22b": ["qwen3-235b-a22b-2507"],
  "magistral-small": ["magistral-small-2506"],
  "magistral-medium": ["magistral-medium-2506"],
  "deepseek-r1": ["deepseek-r1-0528"],
  "devstral-small": ["devstral-small-2505"],
  "deepseek-chat-v3": ["deepseek-chat-v3-0324"],
  r1: ["r1-1776"],
  "mistral-small-24b-instruct": ["mistral-small-24b-instruct-2501"],
  "grok-2-vision": ["grok-2-vision-1212"],
  "grok-2": ["grok-2-1212"],
  "command-r7b-12": ["command-r7b-12-2024"],
  "mistral-large": ["mistral-large-2407", "mistral-large-2411"],
  "pixtral-large": ["pixtral-large-2411"],
  "claude-3.5-haiku": ["claude-3.5-haiku-20241022"],
  "command-r-plus-08": ["command-r-plus-08-2024"],
  "command-r-08": ["command-r-08-2024"],
  "claude-3.5-sonnet": ["claude-3.5-sonnet-20240620"],
  "command-r-plus-04": ["command-r-plus-04-2024"],
  "command-r-03": ["command-r-03-2024"],
  "gpt-3.5-turbo": ["gpt-3.5-turbo-0613"],
  "gpt-4": ["gpt-4-0314"],
};

// Type-safe helper to get model versions
export function getModelVersions(baseModel: string): string[] {
  return modelVersions[baseModel] || [];
}

// Get all base model names
export function getBaseModelNames(): string[] {
  return Object.keys(modelVersions);
}

// Get all versioned model names (flattened)
export function getAllVersionedModels(): string[] {
  return Object.values(modelVersions).flat();
}

export default modelVersions;
