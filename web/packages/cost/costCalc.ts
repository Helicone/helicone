import { costOfPrompt } from "./index";

export function modelCost(modelRow: {
  model: string;
  sum_prompt_tokens: number;
  sum_completion_tokens: number;
  sum_tokens: number;
  provider: string;
  per_call?: number;
  per_image?: number;
}): number {
  const model = modelRow.model;
  const promptTokens = modelRow.sum_prompt_tokens;
  const completionTokens = modelRow.sum_completion_tokens;
  const perCall = modelRow.per_call;
  const perImage = modelRow.per_image;
  return (
    costOfPrompt({
      model,
      promptTokens,
      completionTokens,
      provider: modelRow.provider,
      perCall,
      images: perImage,
    }) ?? 0
  );
}
