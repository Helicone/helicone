import { ModelRow } from "../../interfaces/Cost";

// Per-token USD prices from https://api.runcrate.ai/v1/models (pricing.prompt,
// pricing.completion and pricing.input_cache_read).
export const costs: ModelRow[] = [
  {
    model: {
      operator: "equals",
      value: "aion-labs/aion-3-0",
    },
    cost: {
      prompt_token: 0.000003,
      completion_token: 0.000006,
      prompt_cache_read_token: 0.00000075,
    },
  },
  {
    model: {
      operator: "equals",
      value: "anthropic/claude-fable-5",
    },
    cost: {
      prompt_token: 0.00001,
      completion_token: 0.00005,
      prompt_cache_read_token: 0.000001,
    },
  },
  {
    model: {
      operator: "equals",
      value: "anthropic/claude-fable-5.1",
    },
    cost: {
      prompt_token: 0.00001,
      completion_token: 0.00005,
      prompt_cache_read_token: 0.00000025,
    },
  },
  {
    model: {
      operator: "equals",
      value: "anthropic/claude-haiku-4-5",
    },
    cost: {
      prompt_token: 0.000001,
      completion_token: 0.000005,
      prompt_cache_read_token: 0.0000001,
    },
  },
  {
    model: {
      operator: "equals",
      value: "anthropic/claude-haiku-5.5",
    },
    cost: {
      prompt_token: 0.0000001,
      completion_token: 0.0000005,
      prompt_cache_read_token: 0.00000001,
    },
  },
  {
    model: {
      operator: "equals",
      value: "anthropic/claude-opus-5",
    },
    cost: {
      prompt_token: 0.000005,
      completion_token: 0.000025,
    },
  },
  {
    model: {
      operator: "equals",
      value: "anthropic/claude-opus-5-5",
    },
    cost: {
      prompt_token: 0.000004,
      completion_token: 0.00002,
      prompt_cache_read_token: 0.0000002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "anthropic/claude-sonnet-5",
    },
    cost: {
      prompt_token: 0.000003,
      completion_token: 0.000015,
      prompt_cache_read_token: 0.0000003,
    },
  },
  {
    model: {
      operator: "equals",
      value: "anthropic/claude-sonnet-5-5",
    },
    cost: {
      prompt_token: 0.000002,
      completion_token: 0.00001,
      prompt_cache_read_token: 0.0000001,
    },
  },
  {
    model: {
      operator: "equals",
      value: "ByteDance-Seed/seed-2-1-turbo",
    },
    cost: {
      prompt_token: 0.0000005,
      completion_token: 0.0000025,
      prompt_cache_read_token: 0.000000075,
    },
  },
  {
    model: {
      operator: "equals",
      value: "ByteDance/Seed-1.8",
    },
    cost: {
      prompt_token: 0.00000025,
      completion_token: 0.000002,
      prompt_cache_read_token: 0.00000005,
    },
  },
  {
    model: {
      operator: "equals",
      value: "ByteDance/Seed-2.0-code",
    },
    cost: {
      prompt_token: 0.0000005,
      completion_token: 0.000003,
      prompt_cache_read_token: 0.0000001,
    },
  },
  {
    model: {
      operator: "equals",
      value: "ByteDance/Seed-2.0-mini",
    },
    cost: {
      prompt_token: 0.0000001,
      completion_token: 0.0000004,
      prompt_cache_read_token: 0.00000002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "ByteDance/Seed-2.0-pro",
    },
    cost: {
      prompt_token: 0.0000005,
      completion_token: 0.000003,
      prompt_cache_read_token: 0.0000001,
    },
  },
  {
    model: {
      operator: "equals",
      value: "deepseek-ai/DeepSeek-R1-0528",
    },
    cost: {
      prompt_token: 0.0000005,
      completion_token: 0.00000215,
      prompt_cache_read_token: 0.00000035,
    },
  },
  {
    model: {
      operator: "equals",
      value: "deepseek-ai/DeepSeek-V3.2",
    },
    cost: {
      prompt_token: 0.00000026,
      completion_token: 0.00000038,
      prompt_cache_read_token: 0.00000013,
    },
  },
  {
    model: {
      operator: "equals",
      value: "deepseek-ai/DeepSeek-V4-Flash",
    },
    cost: {
      prompt_token: 0.00000009,
      completion_token: 0.00000018,
      prompt_cache_read_token: 0.000000018,
    },
  },
  {
    model: {
      operator: "equals",
      value: "deepseek-ai/DeepSeek-V4-Flash-0731",
    },
    cost: {
      prompt_token: 0.00000006,
      completion_token: 0.00000018,
      prompt_cache_read_token: 0.000000015,
    },
  },
  {
    model: {
      operator: "equals",
      value: "deepseek-ai/DeepSeek-V4-Flash-Vision-Exp",
    },
    cost: {
      prompt_token: 0.0000002156,
      completion_token: 0.0000006468,
      prompt_cache_read_token: 0.00000000686,
    },
  },
  {
    model: {
      operator: "equals",
      value: "deepseek-ai/DeepSeek-V4-Pro",
    },
    cost: {
      prompt_token: 0.0000013,
      completion_token: 0.0000026,
      prompt_cache_read_token: 0.0000001,
    },
  },
  {
    model: {
      operator: "equals",
      value: "deepseek-ai/DeepSeek-V4-Pro-0813",
    },
    cost: {
      prompt_token: 0.0000013,
      completion_token: 0.0000026,
      prompt_cache_read_token: 0.000000043333,
    },
  },
  {
    model: {
      operator: "equals",
      value: "deepseek-ai/DeepSeek-V4.1-Flash",
    },
    cost: {
      prompt_token: 0.00000014,
      completion_token: 0.00000042,
      prompt_cache_read_token: 0.0000000042,
    },
  },
  {
    model: {
      operator: "equals",
      value: "deepseek-ai/DeepSeek-V4.1-Flash-1017",
    },
    cost: {
      prompt_token: 0.000000098,
      completion_token: 0.000000294,
      prompt_cache_read_token: 0.00000000294,
    },
  },
  {
    model: {
      operator: "equals",
      value: "google/gemini-2.5-flash",
    },
    cost: {
      prompt_token: 0.00000015,
      completion_token: 0.00000125,
      prompt_cache_read_token: 0.000000015,
    },
  },
  {
    model: {
      operator: "equals",
      value: "google/gemini-2.5-pro",
    },
    cost: {
      prompt_token: 0.000000625,
      completion_token: 0.000005,
      prompt_cache_read_token: 0.0000000625,
    },
  },
  {
    model: {
      operator: "equals",
      value: "google/gemini-3-5-flash-lite",
    },
    cost: {
      prompt_token: 0.0000003,
      completion_token: 0.0000025,
      prompt_cache_read_token: 0.00000003,
    },
  },
  {
    model: {
      operator: "equals",
      value: "google/gemini-3.1-flash-lite",
    },
    cost: {
      prompt_token: 0.00000025,
      completion_token: 0.0000015,
    },
  },
  {
    model: {
      operator: "equals",
      value: "google/gemini-3.1-pro",
    },
    cost: {
      prompt_token: 0.000002,
      completion_token: 0.000012,
    },
  },
  {
    model: {
      operator: "equals",
      value: "google/gemini-3.1-pro-preview",
    },
    cost: {
      prompt_token: 0.000002,
      completion_token: 0.000012,
      prompt_cache_read_token: 0.0000002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "google/gemini-3.5-flash",
    },
    cost: {
      prompt_token: 0.0000015,
      completion_token: 0.000009,
    },
  },
  {
    model: {
      operator: "equals",
      value: "google/gemini-3.7-flash",
    },
    cost: {
      prompt_token: 0.00000075,
      completion_token: 0.00000375,
    },
  },
  {
    model: {
      operator: "equals",
      value: "google/gemini-3.8-flash",
    },
    cost: {
      prompt_token: 0.000000825,
      completion_token: 0.000004125,
      prompt_cache_read_token: 0.0000000825,
    },
  },
  {
    model: {
      operator: "equals",
      value: "google/gemini-4-argon",
    },
    cost: {
      prompt_token: 0.000002,
      completion_token: 0.00001,
      prompt_cache_read_token: 0.0000001,
    },
  },
  {
    model: {
      operator: "equals",
      value: "google/gemma-3-12b-it",
    },
    cost: {
      prompt_token: 0.00000004,
      completion_token: 0.00000012,
      prompt_cache_read_token: 0.000000006,
    },
  },
  {
    model: {
      operator: "equals",
      value: "google/gemma-3-27b-it",
    },
    cost: {
      prompt_token: 0.00000008,
      completion_token: 0.00000016,
    },
  },
  {
    model: {
      operator: "equals",
      value: "google/gemma-3-4b-it",
    },
    cost: {
      prompt_token: 0.00000005,
      completion_token: 0.0000001,
      prompt_cache_read_token: 0.000000025,
    },
  },
  {
    model: {
      operator: "equals",
      value: "google/gemma-4-26B-A4B-it",
    },
    cost: {
      prompt_token: 0.00000007,
      completion_token: 0.00000034,
    },
  },
  {
    model: {
      operator: "equals",
      value: "google/gemma-4-31B-it",
    },
    cost: {
      prompt_token: 0.000000135,
      completion_token: 0.00000051,
      prompt_cache_read_token: 0.000000075,
    },
  },
  {
    model: {
      operator: "equals",
      value: "google/gemma-4-31B-it-Ultra",
    },
    cost: {
      prompt_token: 0.00000027,
      completion_token: 0.00000076,
    },
  },
  {
    model: {
      operator: "equals",
      value: "google/gemma-4-e2b",
    },
    cost: {
      prompt_token: 0.00000004,
      completion_token: 0.00000008,
      prompt_cache_read_token: 0.000000006,
    },
  },
  {
    model: {
      operator: "equals",
      value: "ibm-granite/granite-4.2-8b",
    },
    cost: {
      prompt_token: 0.00000006,
      completion_token: 0.00000025,
      prompt_cache_read_token: 0.000000015,
    },
  },
  {
    model: {
      operator: "equals",
      value: "inclusionAI/Ling-3.0-flash-VL",
    },
    cost: {
      prompt_token: 0.00000006,
      completion_token: 0.00000018,
      prompt_cache_read_token: 0.000000012,
    },
  },
  {
    model: {
      operator: "equals",
      value: "inclusionAI/Ling-3.1-flash",
    },
    cost: {
      prompt_token: 0.000000075,
      completion_token: 0.000000225,
      prompt_cache_read_token: 0.000000015,
    },
  },
  {
    model: {
      operator: "equals",
      value: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    },
    cost: {
      prompt_token: 0.0000001,
      completion_token: 0.00000032,
      prompt_cache_read_token: 0.000000015,
    },
  },
  {
    model: {
      operator: "equals",
      value: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    },
    cost: {
      prompt_token: 0.00000008,
      completion_token: 0.00000024,
    },
  },
  {
    model: {
      operator: "equals",
      value: "meta-llama/Llama-Guard-4-12B",
    },
    cost: {
      prompt_token: 0.000000144,
      completion_token: 0.000000144,
    },
  },
  {
    model: {
      operator: "equals",
      value: "meta-llama/muse-spark-1.1",
    },
    cost: {
      prompt_token: 0.00000125,
      completion_token: 0.00000425,
      prompt_cache_read_token: 0.00000015,
    },
  },
  {
    model: {
      operator: "equals",
      value: "meta-llama/muse-spark-1.2",
    },
    cost: {
      prompt_token: 0.00000125,
      completion_token: 0.00000425,
      prompt_cache_read_token: 0.00000015,
    },
  },
  {
    model: {
      operator: "equals",
      value: "meta-llama/muse-spark-1.2-contributor",
    },
    cost: {
      prompt_token: 0.0000001,
      completion_token: 0.0000002,
      prompt_cache_read_token: 0.000000002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "meta-llama/muse-spark-1.3",
    },
    cost: {
      prompt_token: 0.00000125,
      completion_token: 0.00000425,
      prompt_cache_read_token: 0.00000015,
    },
  },
  {
    model: {
      operator: "equals",
      value: "meta-llama/muse-spark-1.3-contributor",
    },
    cost: {
      prompt_token: 0.0000001,
      completion_token: 0.0000002,
      prompt_cache_read_token: 0.000000002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "meta-llama/muse-spark-open",
    },
    cost: {
      prompt_token: 0.00000125,
      completion_token: 0.00000425,
      prompt_cache_read_token: 0.00000015,
    },
  },
  {
    model: {
      operator: "equals",
      value: "meta-llama/muse-wonder",
    },
    cost: {
      prompt_token: 0.000004,
      completion_token: 0.00002,
      prompt_cache_read_token: 0.0000002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "meta-models/Muse-Glimmer-30B",
    },
    cost: {
      prompt_token: 0.0000003,
      completion_token: 0.0000012,
      prompt_cache_read_token: 0.00000004,
    },
  },
  {
    model: {
      operator: "equals",
      value: "microsoft/phi-4",
    },
    cost: {
      prompt_token: 0.000000056,
      completion_token: 0.000000112,
    },
  },
  {
    model: {
      operator: "equals",
      value: "MiniMaxAI/MiniMax-M3",
    },
    cost: {
      prompt_token: 0.00000028,
      completion_token: 0.0000011,
      prompt_cache_read_token: 0.000000056,
    },
  },
  {
    model: {
      operator: "equals",
      value: "mistralai/devstral-2-123b",
    },
    cost: {
      prompt_token: 0.0000004,
      completion_token: 0.000002,
      prompt_cache_read_token: 0.00000004,
    },
  },
  {
    model: {
      operator: "equals",
      value: "mistralai/magistral-small-2509",
    },
    cost: {
      prompt_token: 0.0000005,
      completion_token: 0.0000015,
      prompt_cache_read_token: 0.000000075,
    },
  },
  {
    model: {
      operator: "equals",
      value: "mistralai/ministral-3-14b-instruct",
    },
    cost: {
      prompt_token: 0.0000002,
      completion_token: 0.0000002,
      prompt_cache_read_token: 0.00000002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "mistralai/ministral-3-3b-instruct",
    },
    cost: {
      prompt_token: 0.0000001,
      completion_token: 0.0000001,
      prompt_cache_read_token: 0.00000001,
    },
  },
  {
    model: {
      operator: "equals",
      value: "mistralai/ministral-3-8b-instruct",
    },
    cost: {
      prompt_token: 0.00000015,
      completion_token: 0.00000015,
      prompt_cache_read_token: 0.000000015,
    },
  },
  {
    model: {
      operator: "equals",
      value: "mistralai/mistral-large-3",
    },
    cost: {
      prompt_token: 0.0000005,
      completion_token: 0.0000015,
      prompt_cache_read_token: 0.00000005,
    },
  },
  {
    model: {
      operator: "equals",
      value: "mistralai/Mistral-Nemo-Instruct-2407",
    },
    cost: {
      prompt_token: 0.000000029,
      completion_token: 0.00000003,
    },
  },
  {
    model: {
      operator: "equals",
      value: "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
    },
    cost: {
      prompt_token: 0.000000075,
      completion_token: 0.0000002,
      prompt_cache_read_token: 0.0000000112,
    },
  },
  {
    model: {
      operator: "equals",
      value: "mistralai/mistral-small-4",
    },
    cost: {
      prompt_token: 0.00000015,
      completion_token: 0.0000006,
      prompt_cache_read_token: 0.000000015,
    },
  },
  {
    model: {
      operator: "equals",
      value: "moonshotai/Kimi-K2.6",
    },
    cost: {
      prompt_token: 0.00000075,
      completion_token: 0.0000035,
      prompt_cache_read_token: 0.00000015,
    },
  },
  {
    model: {
      operator: "equals",
      value: "moonshotai/Kimi-K3",
    },
    cost: {
      prompt_token: 0.00000285,
      completion_token: 0.00001425,
      prompt_cache_read_token: 0.000000285,
    },
  },
  {
    model: {
      operator: "equals",
      value: "moonshotai/kimi-k3.1-pro",
    },
    cost: {
      prompt_token: 0.000002,
      completion_token: 0.00001,
      prompt_cache_read_token: 0.0000002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "nvidia/Nemotron-Content-Safety-3.5",
    },
    cost: {
      prompt_token: 0.0000002,
      completion_token: 0.0000002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "nvidia/NVIDIA-Nemotron-3-Super-120B-A12B",
    },
    cost: {
      prompt_token: 0.000000085,
      completion_token: 0.0000004,
    },
  },
  {
    model: {
      operator: "equals",
      value: "nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B",
    },
    cost: {
      prompt_token: 0.0000005,
      completion_token: 0.0000022,
      prompt_cache_read_token: 0.0000001,
    },
  },
  {
    model: {
      operator: "equals",
      value: "nvidia/NVIDIA-Nemotron-3.5-Lightning",
    },
    cost: {
      prompt_token: 0.00000006,
      completion_token: 0.00000016,
      prompt_cache_read_token: 0.00000003,
    },
  },
  {
    model: {
      operator: "equals",
      value: "nvidia/NVIDIA-Nemotron-3.5-Super-VL",
    },
    cost: {
      prompt_token: 0.00000015,
      completion_token: 0.0000005,
      prompt_cache_read_token: 0.00000002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "nvidia/nvidia-nemotron-nano-12b-v2",
    },
    cost: {
      prompt_token: 0.0000002,
      completion_token: 0.0000006,
      prompt_cache_read_token: 0.00000003,
    },
  },
  {
    model: {
      operator: "equals",
      value: "openai/gpt-5.3-codex",
    },
    cost: {
      prompt_token: 0.00000175,
      completion_token: 0.000014,
      prompt_cache_read_token: 0.000000175,
    },
  },
  {
    model: {
      operator: "equals",
      value: "openai/gpt-5.4-mini",
    },
    cost: {
      prompt_token: 0.00000075,
      completion_token: 0.0000045,
      prompt_cache_read_token: 0.000000075,
    },
  },
  {
    model: {
      operator: "equals",
      value: "openai/gpt-5.4-nano",
    },
    cost: {
      prompt_token: 0.0000002,
      completion_token: 0.00000125,
      prompt_cache_read_token: 0.00000002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "openai/gpt-5.4-pro",
    },
    cost: {
      prompt_token: 0.00003,
      completion_token: 0.00018,
      prompt_cache_read_token: 0.0000045,
    },
  },
  {
    model: {
      operator: "equals",
      value: "openai/gpt-5.5",
    },
    cost: {
      prompt_token: 0.000005,
      completion_token: 0.00003,
      prompt_cache_read_token: 0.0000005,
    },
  },
  {
    model: {
      operator: "equals",
      value: "openai/gpt-5.6-sol-pro",
    },
    cost: {
      prompt_token: 0.000004,
      completion_token: 0.00002,
      prompt_cache_read_token: 0.0000004,
    },
  },
  {
    model: {
      operator: "equals",
      value: "openai/gpt-5.6-terra",
    },
    cost: {
      prompt_token: 0.000002,
      completion_token: 0.000012,
      prompt_cache_read_token: 0.0000002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "openai/gpt-6-astra",
    },
    cost: {
      prompt_token: 0.00001,
      completion_token: 0.00005,
      prompt_cache_read_token: 0.000001,
    },
  },
  {
    model: {
      operator: "equals",
      value: "openai/gpt-6-luna",
    },
    cost: {
      prompt_token: 0.0000001,
      completion_token: 0.0000005,
      prompt_cache_read_token: 0.00000001,
    },
  },
  {
    model: {
      operator: "equals",
      value: "openai/gpt-6.1-sol",
    },
    cost: {
      prompt_token: 0.000002,
      completion_token: 0.00001,
      prompt_cache_read_token: 0.0000001,
    },
  },
  {
    model: {
      operator: "equals",
      value: "openai/gpt-oss-120b",
    },
    cost: {
      prompt_token: 0.000000037,
      completion_token: 0.00000017,
      prompt_cache_read_token: 0.00000000555,
    },
  },
  {
    model: {
      operator: "equals",
      value: "openai/gpt-oss-120b-Ultra",
    },
    cost: {
      prompt_token: 0.0000002,
      completion_token: 0.00000095,
    },
  },
  {
    model: {
      operator: "equals",
      value: "openai/gpt-oss-20b",
    },
    cost: {
      prompt_token: 0.00000003,
      completion_token: 0.00000014,
    },
  },
  {
    model: {
      operator: "equals",
      value: "openai/gpt-oss-safeguard-120b",
    },
    cost: {
      prompt_token: 0.00000015,
      completion_token: 0.0000006,
      prompt_cache_read_token: 0.0000000225,
    },
  },
  {
    model: {
      operator: "equals",
      value: "openai/gpt-oss-safeguard-20b",
    },
    cost: {
      prompt_token: 0.000000075,
      completion_token: 0.0000003,
      prompt_cache_read_token: 0.0000000375,
    },
  },
  {
    model: {
      operator: "equals",
      value: "Qwen/qwen-3-7-plus",
    },
    cost: {
      prompt_token: 0.0000005,
      completion_token: 0.000002,
      prompt_cache_read_token: 0.00000005,
    },
  },
  {
    model: {
      operator: "equals",
      value: "Qwen/Qwen3-235B-A22B-Instruct-2507",
    },
    cost: {
      prompt_token: 0.00000009,
      completion_token: 0.00000055,
    },
  },
  {
    model: {
      operator: "equals",
      value: "Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo",
    },
    cost: {
      prompt_token: 0.0000003,
      completion_token: 0.000001,
      prompt_cache_read_token: 0.0000001,
    },
  },
  {
    model: {
      operator: "equals",
      value: "Qwen/Qwen3-Next-80B-A3B-Instruct",
    },
    cost: {
      prompt_token: 0.000000072,
      completion_token: 0.00000088,
      prompt_cache_read_token: 0.0000000108,
    },
  },
  {
    model: {
      operator: "equals",
      value: "Qwen/Qwen3-VL-235B-A22B-Instruct",
    },
    cost: {
      prompt_token: 0.0000002,
      completion_token: 0.00000088,
      prompt_cache_read_token: 0.00000011,
    },
  },
  {
    model: {
      operator: "equals",
      value: "Qwen/Qwen3-VL-30B-A3B-Instruct",
    },
    cost: {
      prompt_token: 0.00000015,
      completion_token: 0.0000006,
    },
  },
  {
    model: {
      operator: "equals",
      value: "Qwen/Qwen3.5-27B",
    },
    cost: {
      prompt_token: 0.00000026,
      completion_token: 0.0000026,
    },
  },
  {
    model: {
      operator: "equals",
      value: "Qwen/Qwen3.5-35B-A3B",
    },
    cost: {
      prompt_token: 0.00000014,
      completion_token: 0.000001,
      prompt_cache_read_token: 0.00000005,
    },
  },
  {
    model: {
      operator: "equals",
      value: "Qwen/Qwen3.5-397B-A17B",
    },
    cost: {
      prompt_token: 0.00000045,
      completion_token: 0.000003,
      prompt_cache_read_token: 0.00000022,
    },
  },
  {
    model: {
      operator: "equals",
      value: "Qwen/Qwen3.5-9B",
    },
    cost: {
      prompt_token: 0.0000001,
      completion_token: 0.00000015,
    },
  },
  {
    model: {
      operator: "equals",
      value: "Qwen/Qwen3.6-27B",
    },
    cost: {
      prompt_token: 0.00000032,
      completion_token: 0.0000032,
    },
  },
  {
    model: {
      operator: "equals",
      value: "Qwen/Qwen3.6-35B-A3B",
    },
    cost: {
      prompt_token: 0.0000001,
      completion_token: 0.00000095,
    },
  },
  {
    model: {
      operator: "equals",
      value: "Qwen/Qwen3.7-Max",
    },
    cost: {
      prompt_token: 0.0000025,
      completion_token: 0.0000075,
      prompt_cache_read_token: 0.0000005,
    },
  },
  {
    model: {
      operator: "equals",
      value: "Qwen/Qwen3.8-27B",
    },
    cost: {
      prompt_token: 0.00000015,
      completion_token: 0.000001875,
      prompt_cache_read_token: 0.0000000375,
    },
  },
  {
    model: {
      operator: "equals",
      value: "Qwen/Qwen3.8-Flash",
    },
    cost: {
      prompt_token: 0.000000113,
      completion_token: 0.000000382,
      prompt_cache_read_token: 0.000000012053,
    },
  },
  {
    model: {
      operator: "equals",
      value: "Qwen/Qwen3.8-Max",
    },
    cost: {
      prompt_token: 0.00000165,
      completion_token: 0.000004951,
      prompt_cache_read_token: 0.000000206,
    },
  },
  {
    model: {
      operator: "equals",
      value: "Qwen/qwen3.8-max-0902",
    },
    cost: {
      prompt_token: 0.000002,
      completion_token: 0.000006,
      prompt_cache_read_token: 0.00000025,
    },
  },
  {
    model: {
      operator: "equals",
      value: "Qwen/qwen3.8-omni-flash",
    },
    cost: {
      prompt_token: 0.00000015,
      completion_token: 0.00000047,
      prompt_cache_read_token: 0.000000016,
    },
  },
  {
    model: {
      operator: "equals",
      value: "stepfun-ai/Step-5-Preview",
    },
    cost: {
      prompt_token: 0.000001,
      completion_token: 0.0000027,
      prompt_cache_read_token: 0.0000001,
    },
  },
  {
    model: {
      operator: "equals",
      value: "tencent/Hy4-preview",
    },
    cost: {
      prompt_token: 0.000000834,
      completion_token: 0.000002501,
      prompt_cache_read_token: 0.000000042,
    },
  },
  {
    model: {
      operator: "equals",
      value: "thinkingmachines/Inkling-Small",
    },
    cost: {
      prompt_token: 0.00000045,
      completion_token: 0.0000012,
      prompt_cache_read_token: 0.0000001,
    },
  },
  {
    model: {
      operator: "equals",
      value: "x-ai/grok-4.20-multi-agent-beta",
    },
    cost: {
      prompt_token: 0.00000125,
      completion_token: 0.0000025,
      prompt_cache_read_token: 0.0000002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "x-ai/grok-4.5",
    },
    cost: {
      prompt_token: 0.000002,
      completion_token: 0.000006,
      prompt_cache_read_token: 0.0000003,
    },
  },
  {
    model: {
      operator: "equals",
      value: "x-ai/grok-4.7",
    },
    cost: {
      prompt_token: 0.000002,
      completion_token: 0.000006,
      prompt_cache_read_token: 0.0000005,
    },
  },
  {
    model: {
      operator: "equals",
      value: "x-ai/grok-build-0-1",
    },
    cost: {
      prompt_token: 0.000001,
      completion_token: 0.000002,
      prompt_cache_read_token: 0.0000002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "XiaomiMiMo/MiMo-V2.6-Flash",
    },
    cost: {
      prompt_token: 0.000000091,
      completion_token: 0.000000182,
      prompt_cache_read_token: 0.00000000182,
    },
  },
  {
    model: {
      operator: "equals",
      value: "XiaomiMiMo/MiMo-V2.6-Pro",
    },
    cost: {
      prompt_token: 0.000000387,
      completion_token: 0.000000783,
      prompt_cache_read_token: 0.00000000324,
    },
  },
  {
    model: {
      operator: "equals",
      value: "XiaomiMiMo/mimo-v2.6-pro-ultraspeed",
    },
    cost: {
      prompt_token: 0.00000435,
      completion_token: 0.0000087,
      prompt_cache_read_token: 0.000000036,
    },
  },
  {
    model: {
      operator: "equals",
      value: "zai-org/GLM-4.7",
    },
    cost: {
      prompt_token: 0.00000032,
      completion_token: 0.0000014,
      prompt_cache_read_token: 0.000000064,
    },
  },
  {
    model: {
      operator: "equals",
      value: "zai-org/GLM-5.2",
    },
    cost: {
      prompt_token: 0.0000005625,
      completion_token: 0.0000018,
      prompt_cache_read_token: 0.000000105,
    },
  },
  {
    model: {
      operator: "equals",
      value: "zai-org/GLM-5.3",
    },
    cost: {
      prompt_token: 0.0000005625,
      completion_token: 0.0000025,
      prompt_cache_read_token: 0.000000125,
    },
  },
  {
    model: {
      operator: "equals",
      value: "zai-org/GLM-5.3-Flash",
    },
    cost: {
      prompt_token: 0.00000015,
      completion_token: 0.0000005,
      prompt_cache_read_token: 0.00000003,
    },
  },
  {
    model: {
      operator: "equals",
      value: "zai-org/glm-5.3-prime",
    },
    cost: {
      prompt_token: 0.0000028,
      completion_token: 0.0000088,
      prompt_cache_read_token: 0.00000056,
    },
  },
];
