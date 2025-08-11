/**
 * Perplexity model definitions
 */

import type { Model } from "../../types";

export const perplexityModels = {
  // "sonar-reasoning-pro": {
  //   name: "Perplexity: Sonar Reasoning Pro",
  //   author: "perplexity",
  //   description:
  //     "Note: Sonar Pro pricing includes Perplexity search pricing. See [details here](https://docs.perplexity.ai/guides/pricing#detailed-pricing-breakdown-for-sonar-reasoning-pro-and-sonar-pro)\n\nSonar Reasoning Pro is a premier reasoning model powered by DeepSeek R1 with Chain of Thought (CoT). Designed for advanced use cases, it supports in-depth, multi-step queries with a larger context window and can surface more citations per search, enabling more comprehensive and extensible responses.",
  //   contextLength: 128000,
  //   maxOutputTokens: 4000,
  //   created: "2025-03-07T02:08:28.000Z",
  //   modality: "text+image->text",
  //   tokenizer: "GPT",
  // },
  // "sonar-pro": {
  //   name: "Perplexity: Sonar Pro",
  //   author: "perplexity",
  //   description:
  //     "Note: Sonar Pro pricing includes Perplexity search pricing. See [details here](https://docs.perplexity.ai/guides/pricing#detailed-pricing-breakdown-for-sonar-reasoning-pro-and-sonar-pro)\n\nFor enterprises seeking more advanced capabilities, the Sonar Pro API can handle in-depth, multi-step queries with added extensibility, like double the number of citations per search as Sonar on average. Plus, with a larger context window, it can handle longer and more nuanced searches and follow-up questions. ",
  //   contextLength: 200000,
  //   maxOutputTokens: 8000,
  //   created: "2025-03-07T01:53:43.000Z",
  //   modality: "text+image->text",
  //   tokenizer: "GPT",
  // },
  // "sonar-reasoning": {
  //   name: "Perplexity: Sonar Reasoning",
  //   author: "perplexity",
  //   description:
  //     "Sonar Reasoning is a reasoning model provided by Perplexity based on [DeepSeek R1](/deepseek/deepseek-r1).\n\nIt allows developers to utilize long chain of thought with built-in web search. Sonar Reasoning is uncensored and hosted in US datacenters. ",
  //   contextLength: 127000,
  //   maxOutputTokens: 4000,
  //   created: "2025-01-29T06:11:47.000Z",
  //   modality: "text->text",
  //   tokenizer: "GPT",
  // },
  // sonar: {
  //   name: "Perplexity: Sonar",
  //   author: "perplexity",
  //   description:
  //     "Sonar is lightweight, affordable, fast, and simple to use — now featuring citations and the ability to customize sources. It is designed for companies seeking to integrate lightweight question-and-answer features optimized for speed.",
  //   contextLength: 127072,
  //   maxOutputTokens: 4000,
  //   created: "2025-01-27T21:36:48.000Z",
  //   modality: "text+image->text",
  //   tokenizer: "GPT",
  // },
} satisfies Record<string, Model>;

export type PerplexityModelName = keyof typeof perplexityModels;
