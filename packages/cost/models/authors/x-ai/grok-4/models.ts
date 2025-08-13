import type { Model } from "../../../types";

export const models = {
  // "grok-4": {
  //   name: "xAI: Grok 4",
  //   author: "x-ai",
  //   description:
  //     "Grok 4 is xAI's latest reasoning model with a 256k context window. It supports parallel tool calling, structured outputs, and both image and text inputs. Note that reasoning is not exposed, reasoning cannot be disabled, and the reasoning effort cannot be specified. Pricing increases once the total tokens in a given request is greater than 128k tokens. See more details on the [xAI docs](https://docs.x.ai/docs/models/grok-4-0709)",
  //   contextLength: 256000,
  //   maxOutputTokens: 4000,
  //   created: "2025-07-09T19:01:29.000Z",
  //   modality: "text+image->text",
  //   tokenizer: "Grok",
  // },
} satisfies Record<string, Model>;