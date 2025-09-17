import type { ModelConfig } from "../../../types";

export const models = {
  "mistral-small": {
    name: "Mistral: Mistral-Small",
    author: "mistralai",
    description:
      "Mistral-Small-3.2-24B-Instruct-2506 is an updated 24B parameter model from Mistral optimized for instruction following, repetition reduction, and improved function calling. Compared to the 3.1 release, version 3.2 significantly improves accuracy on WildBench and Arena Hard, reduces infinite generations, and delivers gains in tool use and structured output tasks. It supports image and text inputs with structured outputs, function/tool calling, and strong performance across coding (HumanEval+, MBPP), STEM (MMLU, MATH, GPQA), and vision benchmarks (ChartQA, DocVQA).",
    contextLength: 128_000,
    maxOutputTokens: 128_000,
    created: "2024-02-26T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Tekken",
  },
} satisfies Record<string, ModelConfig>;

export type MistralNemoModelName = keyof typeof models;
