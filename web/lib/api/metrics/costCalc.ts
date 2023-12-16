import { ModelMetrics } from "./modelMetrics";

// Note: all pricing is per 1k tokens, make sure to divide Anthropic pricing by 1000 as it is per 1M tokens
const COSTS_PROMPT = {
  ada: 0.0004,
  babbage: 0.0005,
  curie: 0.002,
  davinci: 0.02,
  "gpt-3.5-turbo": 0.0015,
  "gpt-35-turbo": 0.0015,
  "gpt-3.5-turbo-1106": 0.001,
  "gpt-4": 0.03,
  "gpt-4-32k": 0.06,
  "gpt-4-32k-0314": 0.06,
  "gpt-4-0613": 0.03,
  "gpt-4-32k-0613": 0.06,
  "gpt-4-1106-preview": 0.01,
  "gpt-4-1106-vision-preview": 0.01,
  "gpt-3.5-turbo-0613": 0.0015,
  "gpt-35-turbo-16k": 0.003,
  "gpt-3.5-turbo-16k-0613": 0.003,
  "text-embedding-ada-002-v2": 0.0001,
  // Latest anthropic pricing from July 2023 (https://www-files.anthropic.com/production/images/model_pricing_july2023.pdf)
  "claude-instant-1	": 0.00163,
  "claude-instant-1.2": 0.00163,
  "claude-2": 0.01102,
  "claude-2.0": 0.01102,
};

// Note: all pricing is per 1k tokens, make sure to divide Anthropic pricing by 1000 as it is per 1M tokens
const COSTS_COMPLETIONS = {
  ada: 0.0004,
  babbage: 0.0005,
  curie: 0.002,
  davinci: 0.02,
  "gpt-3.5-turbo": 0.002,
  "gpt-35-turbo": 0.002,
  "gpt-3.5-turbo-1106": 0.002,
  "gpt-4-0613": 0.06,
  "gpt-4-32k": 0.12,
  "gpt-4-32k-0314": 0.12,
  "gpt-4-32k-0613": 0.12,
  "gpt-4-1106-preview": 0.03,
  "gpt-4-1106-vision-preview": 0.03,
  "gpt-3.5-turbo-0613": 0.002,
  "gpt-3.5-turbo-16k-0613": 0.004,
  "gpt-35-turbo-16k": 0.004,
  // Latest anthropic pricing from July 2023 (https://www-files.anthropic.com/production/images/model_pricing_july2023.pdf)
  "claude-instant-1	": 0.00551,
  "claude-instant-1.2": 0.00551,
  "claude-2": 0.03268,
  "claude-2.0": 0.03268,
};

const OPENAI_FINETUNE_COSTS_PROMPT = {
  ada: 0.0016,
  babbage: 0.0024,
  curie: 0.012,
  davinci: 0.12,
};

const OPENAI_FINETUNE_COSTS_COMPLETIONS = {
  ada: 0.0016,
  babbage: 0.0024,
  curie: 0.012,
  davinci: 0.12,
};

export function modelCost(modelRow: ModelMetrics): number {
  const model = modelRow.model;
  const tokens = modelRow.sum_tokens;
  const promptTokens = modelRow.sum_prompt_tokens;
  const completionTokens = modelRow.sum_completion_tokens;
  if (tokens === null || tokens === undefined) {
    console.error("Tokens is null");
    return 0;
  }
  if (model === null || model === undefined) {
    console.error("Model is null");
    return 0;
  }
  const is_finetuned_model = model.includes(":");

  const model_prefix = is_finetuned_model ? model.split(":")[0] : model;

  const promptCosts = is_finetuned_model
    ? OPENAI_FINETUNE_COSTS_PROMPT
    : COSTS_PROMPT;
  const completionCosts = is_finetuned_model
    ? OPENAI_FINETUNE_COSTS_COMPLETIONS
    : COSTS_COMPLETIONS;

  const promptCost = Object.entries(promptCosts).find(
    ([key]) => key === model_prefix
  )?.[1];
  const completionCost = Object.entries(completionCosts).find(
    ([key]) => key === model_prefix
  )?.[1];
  if (!promptCost || !completionCost) {
    return 0;
  }
  return (promptCost * promptTokens + completionCost * completionTokens) / 1000;
}
