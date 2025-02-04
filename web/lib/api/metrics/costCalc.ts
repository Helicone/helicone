import { costOfPrompt } from "../../../packages/cost";
import { ModelMetrics } from "./modelMetrics";

export function modelCost(modelRow: ModelMetrics): number {
  const model = modelRow.model;
  const promptTokens = modelRow.sum_prompt_tokens;
  const promptCacheWriteTokens = modelRow.prompt_cache_write_tokens;
  const promptCacheReadTokens = modelRow.prompt_cache_read_tokens;
  const completionTokens = modelRow.sum_completion_tokens;
  return (
    costOfPrompt({
      model,
      promptTokens,
      promptCacheWriteTokens,
      promptCacheReadTokens,
      completionTokens,
      provider: modelRow.provider,
    }) ?? 0
  );
}
