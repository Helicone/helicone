import { costOfPrompt } from "./index";

export const COST_PRECISION_MULTIPLIER = 1_000_000_000;

export function modelCost(
  params: {
    provider: string;
    model: string;
    sum_prompt_tokens: number;
    prompt_cache_write_tokens: number;
    prompt_cache_read_tokens: number;
    prompt_audio_tokens: number;
    sum_completion_tokens: number;
    completion_audio_tokens: number;
    prompt_cache_write_5m: number;
    prompt_cache_write_1h: number;
    per_call?: number;
    per_image?: number;
    multiple?: number;
  },
): number {
  return (
    costOfPrompt({
      provider: params.provider,
      model: params.model,
      promptTokens: params.sum_prompt_tokens,
      promptCacheWriteTokens: params.prompt_cache_write_tokens,
      promptCacheReadTokens: params.prompt_cache_read_tokens,
      promptAudioTokens: params.prompt_audio_tokens,
      completionTokens: params.sum_completion_tokens,
      completionAudioTokens: params.completion_audio_tokens,
      promptCacheWrite5m: params.prompt_cache_write_5m,
      promptCacheWrite1h: params.prompt_cache_write_1h,
      perCall: params.per_call,
      images: params.per_image,
      multiple: params.multiple,
    }) ?? 0
  );
}
