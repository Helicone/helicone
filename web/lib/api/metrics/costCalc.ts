import { Database } from "../../../supabase/database.types";
import { ModelMetrics } from "./modelMetrics";

const COSTS_PROMPT = {
  ada: 0.0004,
  babbage: 0.0005,
  curie: 0.002,
  davinci: 0.02,
  "gpt-3.5-turbo": 0.002,
  "gpt-4": 0.03,
  //TODO add clauden https://console.anthropic.com/account/pricing
};

const COSTS_COMPLETIONS = {
  ada: 0.0004,
  babbage: 0.0005,
  curie: 0.002,
  davinci: 0.02,
  "gpt-3.5-turbo": 0.002,
  "gpt-4": 0.06,
  //TODO add claude https://console.anthropic.com/account/pricing
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
  if (tokens === null) {
    console.error("Tokens is null");
    return 0;
  }
  if (model === null) {
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

  const promptCost = Object.entries(promptCosts).find(([key]) =>
    model_prefix.includes(key)
  )?.[1];
  const completionCost = Object.entries(completionCosts).find(([key]) =>
    model_prefix.includes(key)
  )?.[1];
  if (!promptCost || !completionCost) {
    console.error("No cost found for model", model);
    return 0;
  }
  return (promptCost * promptTokens + completionCost * completionTokens) / 1000;
}
