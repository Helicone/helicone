import { ModelConfig } from "../../../types";

export const models = {
  "llama-4-scout": {
    name: "Meta Llama 4 Scout 17B 16E",
    author: "meta-llama",
    description:
      "Llama 4 instruction-tuned MoE (17B, 16 experts) for fast, high-quality chat, tool use, and multilingual reasoning with balanced latency and cost.",
    contextLength: 131_072,
    maxOutputTokens: 8_192,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "llama-4-maverick": {
    name: "Meta Llama 4 Maverick 17B 128E",
    author: "meta-llama",
    description:
      "Llama 4 instruction-tuned MoE (17B, 128 experts) targeting tougher reasoning and long-form tasks, trading more compute for higher response diversity and robustness.",
    contextLength: 131_072,
    maxOutputTokens: 8_192,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "llama-guard-4": {
    name: "Meta Llama Guard 4 12B",
    author: "meta-llama",
    description:
      "Meta’s latest safety/guardrail model for prompt and output moderation, aligning conversations to policy via classification and constrained generation.",
    contextLength: 131_072,
    maxOutputTokens: 1_024,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "llama-3.3-70b-versatile": {
    name: "Meta Llama 3.3 70B Versatile",
    author: "meta-llama",
    description:
      "Llama-3.3-70B-Versatile is Meta's advanced multilingual large language model, optimized for a wide range of natural language processing tasks. With 70 billion parameters, it offers high performance across various benchmarks while maintaining efficiency suitable for diverse applications.",
    contextLength: 131_072,
    maxOutputTokens: 32_678,
    created: "2024-12-06T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "llama-3.3-70b-instruct": {
    name: "Meta Llama 3.3 70B Instruct",
    author: "meta-llama",
    description:
      "The Meta Llama 3.3 multilingual large language model (LLM) is a pretrained and instruction tuned generative model in 70B (text in/text out). The Llama 3.3 instruction tuned text only model is optimized for multilingual dialogue use cases and outperforms many of the available open source and closed chat models on common industry benchmarks. Supported languages: English, German, French, Italian, Portuguese, Hindi, Spanish, and Thai.",
    contextLength: 128_000,
    maxOutputTokens: 16_400,
    created: "2024-12-06T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "llama-3.1-8b-instant": {
    name: "Meta Llama 3.1 8B Instant",
    author: "meta-llama",
    description:
      "Compact 8B general-purpose model offering efficient inference for chat, coding, and RAG workflows on limited compute.",
    contextLength: 131_072,
    maxOutputTokens: 32_678,
    created: "2024-07-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "llama-prompt-guard-2-86m": {
    name: "Meta Llama Prompt Guard 2 86M",
    author: "meta-llama",
    description:
      "86M parameter multilingual prompt safety classifier based on mDeBERTa-base, detecting prompt injections and jailbreaks across 8+ languages with adversarial-resistant tokenization.",
    contextLength: 512,
    maxOutputTokens: 2,
    created: "2024-10-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "llama-prompt-guard-2-22m": {
    name: "Meta Llama Prompt Guard 2 22M",
    author: "meta-llama",
    description:
      "22M parameter lightweight prompt safety classifier based on DeBERTa-xsmall, offering 75% reduced latency for detecting prompt injections and jailbreaks, primarily optimized for English.",
    contextLength: 512,
    maxOutputTokens: 2,
    created: "2024-10-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "llama-3.1-8b-instruct": {
    name: "Meta Llama 3.1 8B Instruct",
    author: "meta-llama",
    description:
      "Meta's latest class of models, Llama 3.1, launched with a variety of sizes and configurations. The 8B instruct-tuned version is particularly fast and efficient. It has demonstrated strong performance in human evaluations, outperforming several leading closed-source models.",
    contextLength: 16_384,
    maxOutputTokens: 16_384,
    created: "2024-07-23T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "llama-3.1-8b-instruct-turbo": {
    name: "Meta Llama 3.1 8B Instruct Turbo",
    author: "meta-llama",
    description:
      "Optimized version of Llama 3.1 8B Instruct with 128K context window, designed for high-speed inference in multilingual chat and dialogue use cases with improved throughput and efficiency.",
    contextLength: 128_000,
    maxOutputTokens: 128_000,
    created: "2024-07-23T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type LlamaModelName = keyof typeof models;
