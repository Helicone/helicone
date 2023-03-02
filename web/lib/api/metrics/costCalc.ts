import { Database } from "../../../supabase/database.types";
import { ModelMetrics } from "./modelMetrics";

const OPENAI_COSTS = {
  ada: 0.0004,
  babbage: 0.0005,
  curie: 0.002,
  davinci: 0.02,
  "gpt-3.5-turbo-0301": 0.002,
};

const OPENAI_FINETUNE_COSTS = {
  ada: 0.0016,
  babbage: 0.0024,
  curie: 0.012,
  davinci: 0.12,
};

export function modelCost(modelRow: ModelMetrics): number {
  const model = modelRow.model;
  const tokens = modelRow.sum_tokens;
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

  const costs = is_finetuned_model ? OPENAI_FINETUNE_COSTS : OPENAI_COSTS;

  const cost = Object.entries(costs).find(([key]) =>
    model_prefix.includes(key)
  )?.[1];
  if (!cost) {
    console.error("No cost found for model", model);
    return 0;
  }
  return (cost * tokens) / 1000;
}
