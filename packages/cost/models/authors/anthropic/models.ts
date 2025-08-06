/**
 * Anthropic model definitions
 */

import { type Model } from "../../types";

/**
 * Anthropic model names
 */
export type AnthropicModelName =
  | "claude-opus-4-1"
  | "claude-opus-4"
  // | "claude-sonnet-4"  // TODO: Add endpoints
  // | "claude-3.7-sonnet"  // TODO: Add endpoints
  // | "claude-3.7-sonnet:thinking"  // TODO: Add endpoints
  // | "claude-3.7-sonnet:beta"  // TODO: Add endpoints
  // | "claude-3.5-haiku-20241022"  // TODO: Add endpoints
  // | "claude-3.5-haiku:beta"  // TODO: Add endpoints
  // | "claude-3.5-haiku"  // TODO: Add endpoints
  // | "claude-3.5-sonnet:beta"  // TODO: Add endpoints
  | "claude-3.5-sonnet"
  // | "claude-3.5-sonnet-20240620:beta"  // TODO: Add endpoints
  // | "claude-3.5-sonnet-20240620"  // TODO: Add endpoints
  // | "claude-3-haiku:beta"  // TODO: Add endpoints
  | "claude-3-haiku"
  // | "claude-3-opus:beta"  // TODO: Add endpoints
  | "claude-3-opus";

export const anthropicModels = {
  "claude-opus-4-1": {
    id: "claude-opus-4-1",
    name: "Anthropic: Claude Opus 4.1",
    author: "anthropic",
    description:
      "Claude Opus 4.1 is an enhanced version of Claude Opus 4, maintaining the same exceptional coding and reasoning capabilities with improved performance and reliability. It continues to excel in software engineering tasks and extended agent workflows.",
    contextLength: 200000,
    maxOutputTokens: 32000,
    created: "2025-06-24T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-opus-4": {
    id: "claude-opus-4",
    name: "Anthropic: Claude Opus 4",
    author: "anthropic",
    description:
      "Claude Opus 4 is benchmarked as the world's best coding model, at time of release, bringing sustained performance on complex, long-running tasks and agent workflows. It sets new benchmarks in software engineering, achieving leading results on SWE-bench (72.5%) and Terminal-bench (43.2%). Opus 4 supports extended, agentic workflows, handling thousands of task steps continuously for hours without degradation.\n\nRead more at the [blog post here](https://www.anthropic.com/news/claude-4)",
    contextLength: 200000,
    maxOutputTokens: 32000,
    created: "2025-05-22T16:27:25.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3.5-sonnet": {
    id: "claude-3.5-sonnet",
    name: "Anthropic: Claude 3.5 Sonnet",
    author: "anthropic",
    description:
      "Claude 3.5 Sonnet delivers better-than-Opus capabilities, faster-than-Sonnet speeds, at the same Sonnet prices. Sonnet 3.5 brings particularly large improvements in coding, with an Aider benchmark score of 18.9%, compared to Claude 3 Opus's score of 13.8%.\n\nOut of all models currently available on the market, Claude 3.5 Sonnet shows the strongest vision capabilities, and it surpasses Claude 3 Opus on inference speed for the vast majority of workloads.",
    contextLength: 200000,
    maxOutputTokens: 8192,
    created: "2024-06-25T16:10:36.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3-haiku": {
    id: "claude-3-haiku",
    name: "Anthropic: Claude 3 Haiku",
    author: "anthropic",
    description:
      "Claude 3 Haiku is Anthropic's fastest, most compact model for near-instant responsiveness. It answers simple queries and requests with speed.",
    contextLength: 200000,
    maxOutputTokens: 4096,
    created: "2024-03-07T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3-opus": {
    id: "claude-3-opus",
    name: "Anthropic: Claude 3 Opus",
    author: "anthropic",
    description:
      "Claude 3 Opus is Anthropic's strongest model, with best-in-market performance on highly complex tasks. It can navigate open-ended prompts and sight-unseen scenarios with remarkable fluency and human-like understanding.",
    contextLength: 200000,
    maxOutputTokens: 4096,
    created: "2024-02-29T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

} satisfies Record<AnthropicModelName, Model>;

export default anthropicModels;