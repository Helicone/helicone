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
      value: "zai/GLM-5.1",
    },
    cost: {
      prompt_token: 0.0000012,
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
  {
    model: {
      operator: "equals",
      value: "deepseek-ai/DeepSeek-V4-Pro",
    },
    cost: {
      prompt_token: 0.00000174,
      completion_token: 0.00000348,
    },
  },
  {
    model: {
      operator: "equals",
      value: "deepseek-ai/Deepseek-V4-Flash",
    },
    cost: {
      prompt_token: 0.00000014,
      completion_token: 0.00000028,
    },
  },
  {
    model: {
      operator: "equals",
      value: "Qwen/Qwen3-235B-A22B-Instruct-2507",
    },
    cost: {
      prompt_token: 0.00000022,
      completion_token: 0.0000008,
    },
  },
  {
    model: {
      operator: "equals",
      value: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
    },
    cost: {
      prompt_token: 0.00000005,
      completion_token: 0.0000002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "nvidia/NVIDIA-Nemotron-3-Super-120B-A12B",
    },
    cost: {
      prompt_token: 0.0000003,
      completion_token: 0.0000024,
    },
  },
  {
    model: {
      operator: "equals",
      value: "nvidia/Nemotron-3-Nano-Omni-Reasoning-30B-A3B",
    },
    cost: {
      prompt_token: 0.0000003,
      completion_token: 0.00000183,
    },
  },
  {
    model: {
      operator: "equals",
      value: "nvidia/Nemotron-3.5-Lightning-30B-A3B",
    },
    cost: {
      prompt_token: 0.00000005,
      completion_token: 0.00000003,
    },
  },
];
