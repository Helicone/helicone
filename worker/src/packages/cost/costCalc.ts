import { costOfPrompt } from "./index";

export function modelCost(modelRow: {
  provider: string;
  model: string;
  sum_prompt_tokens: number;
  prompt_cache_write_tokens: number;
  prompt_cache_read_tokens: number;
  sum_completion_tokens: number;
  sum_tokens: number;
  per_call?: number;
  per_image?: number;
}): number {
  return (
    costOfPrompt({
      provider: modelRow.provider,
      model: modelRow.model,
      promptTokens: modelRow.sum_prompt_tokens,
      promptCacheWriteTokens: modelRow.prompt_cache_write_tokens,
      promptCacheReadTokens: modelRow.prompt_cache_read_tokens,
      completionTokens: modelRow.sum_completion_tokens,
      perCall: modelRow.per_call,
      images: modelRow.per_image,
    }) ?? 0
  );
}
