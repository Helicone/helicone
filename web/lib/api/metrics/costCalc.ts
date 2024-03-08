import { costOfPrompt } from "../../../packages/cost";
import { ModelMetrics } from "./modelMetrics";

export function modelCost(modelRow: ModelMetrics): number {
  const model = modelRow.model;
  const promptTokens = modelRow.sum_prompt_tokens;
  const completionTokens = modelRow.sum_completion_tokens;
  return costOfPrompt({ model, promptTokens, completionTokens }) ?? 0;
}
