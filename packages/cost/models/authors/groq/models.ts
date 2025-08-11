/**
 * Groq model definitions
 */

import type { Model } from "../../types";

/**
 * Groq model names as const array
 */
export const groqModelNames = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant", 
  "llama-guard-4-12b",
  "deepseek-r1-distill-llama-70b",
  "llama-4-maverick-17b-128e-instruct",
  "llama-4-scout-17b-16e-instruct",
  "qwen3-32b",
  "whisper-large-v3",
  "whisper-large-v3-turbo",
] as const;

export type GroqModelName = (typeof groqModelNames)[number];

export const groqModels = {
  "llama-3.3-70b-versatile": {
    name: "Groq: Llama 3.3 70B Versatile",
    author: "meta-llama",
    description:
      "Meta's latest 70B parameter Llama model with enhanced versatile capabilities. Optimized for Groq's LPU infrastructure for ultra-fast inference speeds up to 800+ tokens/sec.",
    contextLength: 131072,
    maxOutputTokens: 32768,
    created: "2024-12-06T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "Llama3",
  },

  "llama-3.1-8b-instant": {
    name: "Groq: Llama 3.1 8B Instant",
    author: "meta-llama",
    description:
      "Compact and efficient 8B parameter Llama 3.1 model optimized for instant responses on Groq's LPU. Ideal for high-throughput, low-latency applications.",
    contextLength: 131072,
    maxOutputTokens: 32768,
    created: "2024-07-23T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "Llama3",
  },

  "llama-guard-4-12b": {
    name: "Groq: Llama Guard 4 12B",
    author: "meta-llama",
    description:
      "Safety-focused 12B parameter model designed for content moderation and safety classification. Specialized for identifying harmful or inappropriate content.",
    contextLength: 131072,
    maxOutputTokens: 32768,
    created: "2024-11-15T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "Llama3",
  },

  "deepseek-r1-distill-llama-70b": {
    name: "Groq: DeepSeek R1 Distill Llama 70B",
    author: "deepseek",
    description:
      "DeepSeek's reasoning model distilled into a 70B Llama architecture. Combines DeepSeek's reasoning capabilities with Llama's performance and Groq's speed.",
    contextLength: 131072,
    maxOutputTokens: 32768,
    created: "2025-01-20T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "Llama3",
  },

  "llama-4-maverick-17b-128e-instruct": {
    name: "Groq: Llama 4 Maverick 17B x128E Instruct",
    author: "meta-llama",
    description:
      "Experimental Llama 4 model with 17B parameters and 128 expert routing. Features advanced mixture-of-experts architecture for specialized task handling.",
    contextLength: 131072,
    maxOutputTokens: 32768,
    created: "2024-12-15T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "Llama4",
  },

  "llama-4-scout-17b-16e-instruct": {
    name: "Groq: Llama 4 Scout 17B x16E Instruct",
    author: "meta-llama",
    description:
      "Lightweight Llama 4 model with 17B parameters and 16 expert routing. Balanced performance and efficiency for diverse instruction-following tasks.",
    contextLength: 131072,
    maxOutputTokens: 32768,
    created: "2024-12-15T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "Llama4",
  },

  "qwen3-32b": {
    name: "Groq: Qwen 3 32B",
    author: "qwen",
    description:
      "Alibaba's Qwen 3 model with 32B parameters. Advanced multilingual capabilities with strong performance in Chinese and English. Optimized for Groq's inference speed.",
    contextLength: 131072,
    maxOutputTokens: 32768,
    created: "2024-12-01T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "Qwen",
  },

  "whisper-large-v3": {
    name: "Groq: Whisper Large V3",
    author: "openai",
    description:
      "OpenAI's large-scale automatic speech recognition model, optimized for Groq's LPU infrastructure. Supports multiple languages with high accuracy.",
    contextLength: 448,
    maxOutputTokens: 448,
    created: "2023-11-06T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "GPT",
  },

  "whisper-large-v3-turbo": {
    name: "Groq: Whisper Large V3 Turbo",
    author: "openai",
    description:
      "Turbocharged version of Whisper Large V3 with enhanced speed optimizations on Groq's LPU. Faster speech recognition with maintained accuracy.",
    contextLength: 448,
    maxOutputTokens: 448,
    created: "2024-11-25T00:00:00.000Z",
    modality: "text->text",
    tokenizer: "GPT",
  },
} satisfies Record<GroqModelName, Model>;