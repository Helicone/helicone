/**
 * Amazon model definitions
 */

import type { Model } from "../../types";

export const amazonModels = {
  // "nova-lite-v1": {
  //   name: "Amazon: Nova Lite 1.0",
  //   author: "amazon",
  //   description:
  //     "Amazon Nova Lite 1.0 is a very low-cost multimodal model from Amazon that focused on fast processing of image, video, and text inputs to generate text output. Amazon Nova Lite can handle real-time customer interactions, document analysis, and visual question-answering tasks with high accuracy.\n\nWith an input context of 300K tokens, it can analyze multiple images or up to 30 minutes of video in a single input.",
  //   contextLength: 300000,
  //   maxOutputTokens: 5120,
  //   created: "2024-12-05T22:22:43.000Z",
  //   modality: "text+image->text",
  //   tokenizer: "GPT",
  // },
  // "nova-micro-v1": {
  //   name: "Amazon: Nova Micro 1.0",
  //   author: "amazon",
  //   description:
  //     "Amazon Nova Micro 1.0 is a text-only model that delivers the lowest latency responses in the Amazon Nova family of models at a very low cost. With a context length of 128K tokens and optimized for speed and cost, Amazon Nova Micro excels at tasks such as text summarization, translation, content classification, interactive chat, and brainstorming. It has simple mathematical reasoning and coding abilities.",
  //   contextLength: 128000,
  //   maxOutputTokens: 5120,
  //   created: "2024-12-05T22:20:37.000Z",
  //   modality: "text->text",
  //   tokenizer: "GPT",
  // },
  // "nova-pro-v1": {
  //   name: "Amazon: Nova Pro 1.0",
  //   author: "amazon",
  //   description:
  //     "Amazon Nova Pro 1.0 is a capable multimodal model from Amazon focused on providing a combination of accuracy, speed, and cost for a wide range of tasks. As of December 2024, it achieves state-of-the-art performance on key benchmarks including visual question answering (TextVQA) and video understanding (VATEX).\n\nAmazon Nova Pro demonstrates strong capabilities in processing both visual and textual information and at analyzing financial documents.\n\n**NOTE**: Video input is not supported at this time.",
  //   contextLength: 300000,
  //   maxOutputTokens: 5120,
  //   created: "2024-12-05T22:05:03.000Z",
  //   modality: "text+image->text",
  //   tokenizer: "GPT",
  // },
} satisfies Record<string, Model>;

export type AmazonModelName = keyof typeof amazonModels;
