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
  | "claude-sonnet-4"
  | "claude-3.7-sonnet"
  | "claude-3.7-sonnet:thinking"
  | "claude-3.7-sonnet:beta"
  | "claude-3.5-haiku-20241022"
  | "claude-3.5-haiku:beta"
  | "claude-3.5-haiku"
  | "claude-3.5-sonnet:beta"
  | "claude-3.5-sonnet"
  | "claude-3.5-sonnet-20240620:beta"
  | "claude-3.5-sonnet-20240620"
  | "claude-3-haiku:beta"
  | "claude-3-haiku"
  | "claude-3-opus:beta"
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

  "claude-sonnet-4": {
    id: "claude-sonnet-4",
    name: "Anthropic: Claude Sonnet 4",
    author: "anthropic",
    description:
      "Claude Sonnet 4 significantly enhances the capabilities of its predecessor, Sonnet 3.7, excelling in both coding and reasoning tasks with improved precision and controllability. Achieving state-of-the-art performance on SWE-bench (72.7%), Sonnet 4 balances capability and computational efficiency, making it suitable for a broad range of applications from routine coding tasks to complex software development projects.\n\nRead more at the [blog post here](https://www.anthropic.com/news/claude-4)",
    contextLength: 200000,
    maxOutputTokens: 64000,
    created: "2025-05-22T16:12:51.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3.7-sonnet": {
    id: "claude-3.7-sonnet",
    name: "Anthropic: Claude 3.7 Sonnet",
    author: "anthropic",
    description:
      "Claude 3.7 Sonnet is an advanced large language model with improved reasoning, coding, and problem-solving capabilities. It introduces a hybrid reasoning approach, allowing users to choose between rapid responses and extended, step-by-step processing for complex tasks.\n\nRead more at the [blog post here](https://www.anthropic.com/news/claude-3-7-sonnet)",
    contextLength: 200000,
    maxOutputTokens: 64000,
    created: "2025-02-24T18:35:10.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3.7-sonnet:thinking": {
    id: "claude-3.7-sonnet:thinking",
    name: "Anthropic: Claude 3.7 Sonnet (thinking)",
    author: "anthropic",
    description:
      "Claude 3.7 Sonnet with extended reasoning mode for enhanced accuracy in math, coding, and instruction-following tasks.\n\nRead more at the [blog post here](https://www.anthropic.com/news/claude-3-7-sonnet)",
    contextLength: 200000,
    maxOutputTokens: 64000,
    created: "2025-02-24T18:35:10.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3.7-sonnet:beta": {
    id: "claude-3.7-sonnet:beta",
    name: "Anthropic: Claude 3.7 Sonnet (self-moderated)",
    author: "anthropic",
    description:
      "Claude 3.7 Sonnet with self-moderation capabilities.\n\nRead more at the [blog post here](https://www.anthropic.com/news/claude-3-7-sonnet)",
    contextLength: 200000,
    maxOutputTokens: 128000,
    created: "2025-02-24T18:35:10.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3.5-haiku-20241022": {
    id: "claude-3.5-haiku-20241022",
    name: "Anthropic: Claude 3.5 Haiku (2024-10-22)",
    author: "anthropic",
    description:
      "Claude 3.5 Haiku features enhancements across all skill sets including coding, tool use, and reasoning. As the fastest model in the Anthropic lineup, it offers rapid response times suitable for applications that require high interactivity and low latency.\n\nSee the launch announcement [here](https://www.anthropic.com/news/3-5-models-and-computer-use)",
    contextLength: 200000,
    maxOutputTokens: 8192,
    created: "2024-11-04T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3.5-haiku:beta": {
    id: "claude-3.5-haiku:beta",
    name: "Anthropic: Claude 3.5 Haiku (self-moderated)",
    author: "anthropic",
    description:
      "Claude 3.5 Haiku offers enhanced capabilities in speed, coding accuracy, and tool use. This model is currently pointing to [Claude 3.5 Haiku (2024-10-22)](/anthropic/claude-3-5-haiku-20241022).",
    contextLength: 200000,
    maxOutputTokens: 8192,
    created: "2024-11-04T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3.5-haiku": {
    id: "claude-3.5-haiku",
    name: "Anthropic: Claude 3.5 Haiku",
    author: "anthropic",
    description:
      "Claude 3.5 Haiku offers enhanced capabilities in speed, coding accuracy, and tool use. This model is currently pointing to [Claude 3.5 Haiku (2024-10-22)](/anthropic/claude-3-5-haiku-20241022).",
    contextLength: 200000,
    maxOutputTokens: 8192,
    created: "2024-11-04T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3.5-sonnet:beta": {
    id: "claude-3.5-sonnet:beta",
    name: "Anthropic: Claude 3.5 Sonnet (self-moderated)",
    author: "anthropic",
    description:
      "New Claude 3.5 Sonnet delivers better-than-Opus capabilities, faster-than-Sonnet speeds, at the same Sonnet prices. Sonnet is particularly good at:\n\n- Coding: Scores ~49% on SWE-Bench Verified\n- Data science: Augments human data science expertise\n- Visual processing: excelling at interpreting charts, graphs, and images\n- Agentic tasks: exceptional tool use\n\n#multimodal",
    contextLength: 200000,
    maxOutputTokens: 8192,
    created: "2024-10-22T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3.5-sonnet": {
    id: "claude-3.5-sonnet",
    name: "Anthropic: Claude 3.5 Sonnet",
    author: "anthropic",
    description:
      "New Claude 3.5 Sonnet delivers better-than-Opus capabilities, faster-than-Sonnet speeds, at the same Sonnet prices. Sonnet is particularly good at:\n\n- Coding: Scores ~49% on SWE-Bench Verified\n- Data science: Augments human data science expertise\n- Visual processing: excelling at interpreting charts, graphs, and images\n- Agentic tasks: exceptional tool use\n\n#multimodal",
    contextLength: 200000,
    maxOutputTokens: 8192,
    created: "2024-10-22T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3.5-sonnet-20240620:beta": {
    id: "claude-3.5-sonnet-20240620:beta",
    name: "Anthropic: Claude 3.5 Sonnet (2024-06-20) (self-moderated)",
    author: "anthropic",
    description:
      "Claude 3.5 Sonnet delivers better-than-Opus capabilities at Sonnet prices. For the latest version (2024-10-23), check out [Claude 3.5 Sonnet](/anthropic/claude-3.5-sonnet).\n\n#multimodal",
    contextLength: 200000,
    maxOutputTokens: 8192,
    created: "2024-06-20T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3.5-sonnet-20240620": {
    id: "claude-3.5-sonnet-20240620",
    name: "Anthropic: Claude 3.5 Sonnet (2024-06-20)",
    author: "anthropic",
    description:
      "Claude 3.5 Sonnet delivers better-than-Opus capabilities at Sonnet prices. For the latest version (2024-10-23), check out [Claude 3.5 Sonnet](/anthropic/claude-3.5-sonnet).\n\n#multimodal",
    contextLength: 200000,
    maxOutputTokens: 8192,
    created: "2024-06-20T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3-haiku:beta": {
    id: "claude-3-haiku:beta",
    name: "Anthropic: Claude 3 Haiku (self-moderated)",
    author: "anthropic",
    description:
      "Claude 3 Haiku is Anthropic's fastest and most compact model for near-instant responsiveness.\n\nSee the launch announcement [here](https://www.anthropic.com/news/claude-3-haiku)\n\n#multimodal",
    contextLength: 200000,
    maxOutputTokens: 4096,
    created: "2024-03-13T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3-haiku": {
    id: "claude-3-haiku",
    name: "Anthropic: Claude 3 Haiku",
    author: "anthropic",
    description:
      "Claude 3 Haiku is Anthropic's fastest and most compact model for near-instant responsiveness.\n\nSee the launch announcement [here](https://www.anthropic.com/news/claude-3-haiku)\n\n#multimodal",
    contextLength: 200000,
    maxOutputTokens: 4096,
    created: "2024-03-13T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3-opus:beta": {
    id: "claude-3-opus:beta",
    name: "Anthropic: Claude 3 Opus (self-moderated)",
    author: "anthropic",
    description:
      "Claude 3 Opus is Anthropic's most powerful model for highly complex tasks.\n\nSee the launch announcement [here](https://www.anthropic.com/news/claude-3-family)\n\n#multimodal",
    contextLength: 200000,
    maxOutputTokens: 4096,
    created: "2024-03-05T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },

  "claude-3-opus": {
    id: "claude-3-opus",
    name: "Anthropic: Claude 3 Opus",
    author: "anthropic",
    description:
      "Claude 3 Opus is Anthropic's most powerful model for highly complex tasks.\n\nSee the launch announcement [here](https://www.anthropic.com/news/claude-3-family)\n\n#multimodal",
    contextLength: 200000,
    maxOutputTokens: 4096,
    created: "2024-03-05T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "Claude",
  },
} satisfies Record<AnthropicModelName, Model>;

export default anthropicModels;
