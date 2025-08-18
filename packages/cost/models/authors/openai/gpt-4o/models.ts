import type { ModelConfig } from "../../../types";

export const models = {
  "gpt-4o": {
    name: "OpenAI: GPT-4o",
    author: "openai",
    description:
      'GPT-4o ("o" for "omni") is OpenAI\'s latest AI model, supporting both text and image inputs with text outputs. It maintains the intelligence level of GPT-4 Turbo while being twice as fast and 50% more cost-effective. GPT-4o also offers improved performance in processing non-English languages and enhanced visual capabilities.\n\nFor benchmarking against other models, it was briefly called ["im-also-a-good-gpt2-chatbot"](https://twitter.com/LiamFedus/status/1790064963966370209)\n\n#multimodal',
    contextLength: 128000,
    maxOutputTokens: 16384,
    created: "2024-05-13T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "GPT",
  },
  "gpt-4o:extended": {
    name: "OpenAI: GPT-4o (extended)",
    author: "openai",
    description:
      'GPT-4o ("o" for "omni") is OpenAI\'s latest AI model, supporting both text and image inputs with text outputs. It maintains the intelligence level of GPT-4 Turbo while being twice as fast and 50% more cost-effective. GPT-4o also offers improved performance in processing non-English languages and enhanced visual capabilities.\n\nFor benchmarking against other models, it was briefly called ["im-also-a-good-gpt2-chatbot"](https://twitter.com/LiamFedus/status/1790064963966370209)\n\n#multimodal',
    contextLength: 128000,
    maxOutputTokens: 64000,
    created: "2024-05-13T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "GPT",
  },
  "gpt-4o-mini": {
    name: "OpenAI: GPT-4o-mini",
    author: "openai",
    description:
      "GPT-4o mini is OpenAI's newest model after GPT-4 Omni, supporting both text and image inputs with text outputs.\n\nAs their most advanced small model, it is many multiples more affordable than other recent frontier models, and more than 60% cheaper than GPT-3.5 Turbo. It maintains SOTA intelligence, while being significantly more cost-effective.\n\nGPT-4o mini achieves an 82% score on MMLU and presently ranks higher than GPT-4 on chat preferences common leaderboards.\n\nCheck out the launch announcement to learn more.\n\n#multimodal",
    contextLength: 128000,
    maxOutputTokens: 16384,
    created: "2024-07-18T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "GPT",
  },
  "chatgpt-4o-latest": {
    name: "OpenAI: ChatGPT-4o",
    author: "openai",
    description:
      "OpenAI ChatGPT 4o is continually updated by OpenAI to point to the current version of GPT-4o used by ChatGPT. It therefore differs slightly from the API version of GPT-4o in that it has additional RLHF. It is intended for research and evaluation.\n\nOpenAI notes that this model is not suited for production use-cases as it may be removed or redirected to another model in the future.",
    contextLength: 128000,
    maxOutputTokens: 16384,
    created: "2024-08-14T00:00:00.000Z",
    modality: "text+image->text",
    tokenizer: "GPT",
  },
  "gpt-4o-mini-search-preview": {
    name: "OpenAI: GPT-4o-mini Search Preview",
    author: "openai",
    description:
      "GPT-4o mini Search Preview is a specialized model for web search in Chat Completions. It is trained to understand and execute web search queries.",
    contextLength: 128000,
    maxOutputTokens: 16384,
    created: "2025-03-12T22:22:02.000Z",
    modality: "text->text",
    tokenizer: "GPT",
  },
  "gpt-4o-search-preview": {
    name: "OpenAI: GPT-4o Search Preview",
    author: "openai",
    description:
      "GPT-4o Search Preview is a specialized model for web search in Chat Completions. It is trained to understand and execute web search queries.",
    contextLength: 128000,
    maxOutputTokens: 16384,
    created: "2025-03-12T22:19:09.000Z",
    modality: "text->text",
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type GPT4oModelName = keyof typeof models;
