import { ModelRow } from "../../interfaces/Cost";

export const costs: ModelRow[] = [
  {
    model: {
      operator: "equals",
      value: "zai/GLM-5.2",
    },
    cost: {
      prompt_token: 0.0000014,
      completion_token: 0.0000044,
    },
  },
  {
    model: {
      operator: "equals",
      value: "openai/gpt-oss-120b",
    },
    cost: {
      prompt_token: 0.00000005,
      completion_token: 0.0000002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "google/gemma-4-31b-it",
    },
    cost: {
      prompt_token: 0.00000014,
      completion_token: 0.0000004,
    },
  },
  {
    model: {
      operator: "equals",
      value: "moonshotai/Kimi-K2.6",
    },
    cost: {
      prompt_token: 0.0000007,
      completion_token: 0.0000035,
    },
  },
  {
    model: {
      operator: "equals",
      value: "meta-llama/Llama-3.3-70B-Instruct",
    },
    cost: {
      prompt_token: 0.00000025,
      completion_token: 0.00000075,
    },
  },
  {
    model: {
      operator: "equals",
      value: "deepseek-ai/DeepSeek-V3-0324",
    },
    cost: {
      prompt_token: 0.0000005,
      completion_token: 0.0000015,
    },
  },
];
