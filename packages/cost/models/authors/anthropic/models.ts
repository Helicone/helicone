/**
 * Anthropic model definitions (flat structure)
 */

import type { Model } from "../../types";

// Strict type for Anthropic model names
export type AnthropicModelName =
  | "claude-opus-4-1"
  | "claude-opus-4"
  | "claude-sonnet-4"
  | "claude-3.7-sonnet"
  | "claude-3.5-haiku"
  | "claude-3.5-sonnet"
  | "claude-3-haiku"
  | "claude-3-opus";

// Models are keyed by their ID for O(1) lookup
export const anthropicModels = {
  "claude-opus-4-1": {
    name: "Anthropic: Claude Opus 4.1",
    author: "anthropic",
    description:
      "Our most capable model with the highest level of intelligence and capability. Supports extended thinking, multilingual capabilities, and vision processing. Moderately fast latency with 32,000 max output tokens. Training data cut-off: March 2025. API model name: claude-opus-4-1-20250805",
    contextLength: 200000,
    maxOutputTokens: 32000,
    created: "2025-08-05T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-opus-4": {
    name: "Anthropic: Claude Opus 4",
    author: "anthropic",
    description:
      "Our previous flagship model with very high intelligence and capability. Supports extended thinking, multilingual capabilities, and vision processing. Moderately fast latency with 32,000 max output tokens. Training data cut-off: March 2025. API model name: claude-opus-4-20250514",
    contextLength: 200000,
    maxOutputTokens: 32000,
    created: "2025-05-14T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-sonnet-4": {
    name: "Anthropic: Claude Sonnet 4",
    author: "anthropic",
    description:
      "High-performance model with high intelligence and balanced performance. Supports extended thinking, multilingual capabilities, and vision processing. Fast latency with 64,000 max output tokens. API model name: claude-sonnet-4-20250514",
    contextLength: 200000,
    maxOutputTokens: 64000,
    created: "2025-05-14T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3.7-sonnet": {
    name: "Anthropic: Claude 3.7 Sonnet",
    author: "anthropic",
    description:
      "High-performance model with toggleable extended thinking for complex reasoning tasks. Combines high intelligence with the ability to think through problems step-by-step. Fast latency with 64,000 max output tokens. API model name: claude-3-7-sonnet-20250219",
    contextLength: 200000,
    maxOutputTokens: 64000,
    created: "2025-02-19T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3.5-sonnet": {
    name: "Anthropic: Claude 3.5 Sonnet",
    author: "anthropic",
    description:
      "Our previous intelligent model with high level of intelligence and capability. Fast latency with multilingual and vision capabilities, but no extended thinking. 8,192 max output tokens. Training data cut-off: April 2024. Upgraded version API: claude-3-5-sonnet-20241022, Previous version API: claude-3-5-sonnet-20240620",
    contextLength: 200000,
    maxOutputTokens: 8192,
    created: "2024-10-22T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3.5-haiku": {
    name: "Anthropic: Claude 3.5 Haiku",
    author: "anthropic",
    description:
      "Our fastest model. Intelligence at blazing speeds. Multilingual and vision capabilities. 8,192 max output tokens. Training data cut-off: July 2024. API model name: claude-3-5-haiku-20241022",
    contextLength: 200000,
    maxOutputTokens: 8192,
    created: "2024-10-22T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3-haiku": {
    name: "Anthropic: Claude 3 Haiku",
    author: "anthropic",
    description:
      "Fast and compact model for near-instant responsiveness with quick and accurate targeted performance. Multilingual and vision capabilities. 4,096 max output tokens. Training data cut-off: August 2023. API model name: claude-3-haiku-20240307",
    contextLength: 200000,
    maxOutputTokens: 4096,
    created: "2024-03-07T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3-opus": {
    name: "Anthropic: Claude 3 Opus",
    author: "anthropic",
    description:
      "Very high intelligence and capability model. No extended thinking support, no priority tier access. Multilingual and vision capabilities. 4,096 max output tokens. Training data cut-off: August 2023. API model name: claude-3-opus-20240229",
    contextLength: 200000,
    maxOutputTokens: 4096,
    created: "2024-02-29T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },
} satisfies Record<AnthropicModelName, Model>;
