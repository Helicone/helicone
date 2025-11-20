import { ModelConfig } from "../../../types";

export const model = {
  "gemini-2.5-flash-lite": {
    name: "Google Gemini 2.5 Flash Lite",
    author: "google",
    description:
      'Gemini 2.5 Flash-Lite is a lightweight reasoning model in the Gemini 2.5 family, optimized for ultra-low latency and cost efficiency. It offers improved throughput, faster token generation, and better performance across common benchmarks compared to earlier Flash models. By default, "thinking" (i.e. multi-pass reasoning) is disabled to prioritize speed, but developers can enable it via the [Reasoning API parameter](https://openrouter.ai/docs/use-cases/reasoning-tokens) to selectively trade off cost for intelligence. ',
    contextLength: 1048576,
    maxOutputTokens: 65535,
    created: "2025-07-22T09:04:36",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Gemini",
  },
} satisfies Record<string, ModelConfig>;

export type Gemini25FlashLiteModelName = keyof typeof model;
