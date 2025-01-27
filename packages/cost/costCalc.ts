import { costOfPrompt } from "./index";

export function modelCost(modelRow: {
  model: string;
  sum_prompt_tokens: number;
  sum_completion_tokens: number;
  sum_tokens: number;
  provider: string;
}): number {
  const model = modelRow.model;
  const promptTokens = modelRow.sum_prompt_tokens;
  const completionTokens = modelRow.sum_completion_tokens;
  return (
    costOfPrompt({
      model,
      promptTokens,
      completionTokens,
      provider: modelRow.provider,
    }) ?? 0
  );
}
