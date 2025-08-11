/**
 * DeepSeek model definitions
 */

import type { Model } from "../../types";

/**
 * DeepSeek model names as const array
 */
export const deepseekModelNames = [
  "deepseek-chat",
  "deepseek-reasoner",
] as const;

export type DeepSeekModelName = (typeof deepseekModelNames)[number];

export const deepseekModels = {
  "deepseek-chat": {
    name: "DeepSeek: DeepSeek-V3 Chat",
    author: "deepseek",
    description:
      "DeepSeek-V3 is a powerful generalist AI model trained on 15 trillion tokens. Features 64K context length with support for function calling, JSON output, and advanced reasoning capabilities. Cost-effective frontier AI model.",
    contextLength: 65536,
    maxOutputTokens: 8192,
    created: "2024-12-26T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "DeepSeek",
  },

  "deepseek-reasoner": {
    name: "DeepSeek: DeepSeek-R1 Reasoner",
    author: "deepseek",
    description:
      "DeepSeek-R1 is specialized for advanced reasoning tasks with extended thinking capabilities. Features 64K context length with up to 64K output tokens for complex problem solving and step-by-step reasoning.",
    contextLength: 65536,
    maxOutputTokens: 65536,
    created: "2024-12-26T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "DeepSeek",
  },
} satisfies Record<DeepSeekModelName, Model>;