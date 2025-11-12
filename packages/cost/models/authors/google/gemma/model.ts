import { ModelConfig } from "../../../types";

export const model = {
  "gemma2-9b-it": {
    name: "Google Gemma 2",
    author: "google",
    description:
      "Gemma is a family of lightweight, state-of-the-art open models from Google, built from the same research and technology used to create the Gemini models. They are text-to-text, decoder-only large language models, with open weights for both pre-trained variants and instruction-tuned variants. Gemma models are well-suited for a variety of text generation tasks, including question answering, summarization, and reasoning. Their relatively small size makes it possible to deploy them in environments with limited resources such as a laptop, desktop or your own cloud infrastructure, democratizing access to state of the art AI models and helping foster innovation for everyone.",
    contextLength: 8192,
    maxOutputTokens: 8192,
    created: "2024-06-25T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "Gemini",
  },
} satisfies Record<string, ModelConfig>;

export type GemmaModelName = keyof typeof model;
