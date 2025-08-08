/**
 * Google model definitions
 */

import { type Model } from "../../types";

/**
 * Google model names
 */
export type GoogleModelName =
  | "gemini-2.5-flash-lite"
  | "gemini-2.5-flash-lite-preview-06-17"
  | "gemini-2.5-flash"
  | "gemini-2.5-pro"
  | "gemini-2.5-pro-preview"
  | "gemini-2.5-pro-preview-05-06"
  | "gemini-2.5-pro-exp-03-25";

export const googleModels = {
  "gemini-2.5-flash-lite": {
    id: "gemini-2.5-flash-lite",
    name: "Google: Gemini 2.5 Flash Lite",
    author: "google",
    description:
      'Gemini 2.5 Flash-Lite is a lightweight reasoning model in the Gemini 2.5 family, optimized for ultra-low latency and cost efficiency. It offers improved throughput, faster token generation, and better performance across common benchmarks compared to earlier Flash models. By default, "thinking" (i.e. multi-pass reasoning) is disabled to prioritize speed, but developers can enable it via the [Reasoning API parameter](https://openrouter.ai/docs/use-cases/reasoning-tokens) to selectively trade off cost for intelligence. ',
    contextLength: 1048576,
    maxOutputTokens: 65535,
    created: "2025-07-22T16:04:36.000Z",
    modality: "text+image->text",
    tokenizer: "Gemini",
  },

  "gemini-2.5-flash-lite-preview-06-17": {
    id: "gemini-2.5-flash-lite-preview-06-17",
    name: "Google: Gemini 2.5 Flash Lite Preview 06-17",
    author: "google",
    description:
      'Gemini 2.5 Flash-Lite is a lightweight reasoning model in the Gemini 2.5 family, optimized for ultra-low latency and cost efficiency. It offers improved throughput, faster token generation, and better performance across common benchmarks compared to earlier Flash models. By default, "thinking" (i.e. multi-pass reasoning) is disabled to prioritize speed, but developers can enable it via the [Reasoning API parameter](https://openrouter.ai/docs/use-cases/reasoning-tokens) to selectively trade off cost for intelligence. ',
    contextLength: 1048576,
    maxOutputTokens: 65535,
    created: "2025-06-17T15:23:51.000Z",
    modality: "text+image->text",
    tokenizer: "Gemini",
  },

  "gemini-2.5-flash": {
    id: "gemini-2.5-flash",
    name: "Google: Gemini 2.5 Flash",
    author: "google",
    description:
      'Gemini 2.5 Flash is Google\'s state-of-the-art workhorse model, specifically designed for advanced reasoning, coding, mathematics, and scientific tasks. It includes built-in "thinking" capabilities, enabling it to provide responses with greater accuracy and nuanced context handling. \n\nAdditionally, Gemini 2.5 Flash is configurable through the "max tokens for reasoning" parameter, as described in the documentation (https://openrouter.ai/docs/use-cases/reasoning-tokens#max-tokens-for-reasoning).',
    contextLength: 1048576,
    maxOutputTokens: 65535,
    created: "2025-06-17T15:01:28.000Z",
    modality: "text+image->text",
    tokenizer: "Gemini",
  },

  "gemini-2.5-pro": {
    id: "gemini-2.5-pro",
    name: "Google: Gemini 2.5 Pro",
    author: "google",
    description:
      "Gemini 2.5 Pro is Google\u2019s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks. It employs \u201cthinking\u201d capabilities, enabling it to reason through responses with enhanced accuracy and nuanced context handling. Gemini 2.5 Pro achieves top-tier performance on multiple benchmarks, including first-place positioning on the LMArena leaderboard, reflecting superior human-preference alignment and complex problem-solving abilities.",
    contextLength: 1048576,
    maxOutputTokens: 65536,
    created: "2025-06-17T14:12:24.000Z",
    modality: "text+image->text",
    tokenizer: "Gemini",
  },

  "gemini-2.5-pro-preview": {
    id: "gemini-2.5-pro-preview",
    name: "Google: Gemini 2.5 Pro Preview 06-05",
    author: "google",
    description:
      "Gemini 2.5 Pro is Google\u2019s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks. It employs \u201cthinking\u201d capabilities, enabling it to reason through responses with enhanced accuracy and nuanced context handling. Gemini 2.5 Pro achieves top-tier performance on multiple benchmarks, including first-place positioning on the LMArena leaderboard, reflecting superior human-preference alignment and complex problem-solving abilities.\n",
    contextLength: 1048576,
    maxOutputTokens: 65536,
    created: "2025-06-05T15:27:37.000Z",
    modality: "text+image->text",
    tokenizer: "Gemini",
  },

  "gemini-2.5-pro-preview-05-06": {
    id: "gemini-2.5-pro-preview-05-06",
    name: "Google: Gemini 2.5 Pro Preview 05-06",
    author: "google",
    description:
      "Gemini 2.5 Pro is Google\u2019s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks. It employs \u201cthinking\u201d capabilities, enabling it to reason through responses with enhanced accuracy and nuanced context handling. Gemini 2.5 Pro achieves top-tier performance on multiple benchmarks, including first-place positioning on the LMArena leaderboard, reflecting superior human-preference alignment and complex problem-solving abilities.",
    contextLength: 1048576,
    maxOutputTokens: 65535,
    created: "2025-05-07T00:41:53.000Z",
    modality: "text+image->text",
    tokenizer: "Gemini",
  },

  "gemini-2.5-pro-exp-03-25": {
    id: "gemini-2.5-pro-exp-03-25",
    name: "Google: Gemini 2.5 Pro Experimental",
    author: "google",
    description:
      "This model has been deprecated by Google in favor of the (paid Preview model)[google/gemini-2.5-pro-preview]\n\u00a0\nGemini 2.5 Pro is Google\u2019s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks. It employs \u201cthinking\u201d capabilities, enabling it to reason through responses with enhanced accuracy and nuanced context handling. Gemini 2.5 Pro achieves top-tier performance on multiple benchmarks, including first-place positioning on the LMArena leaderboard, reflecting superior human-preference alignment and complex problem-solving abilities.",
    contextLength: 1048576,
    maxOutputTokens: 65535,
    created: "2025-03-25T17:01:39.000Z",
    modality: "text+image->text",
    tokenizer: "Gemini",
  },
} satisfies Record<GoogleModelName, Model>;

export default googleModels;
