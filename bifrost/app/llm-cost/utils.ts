import { costOf, costOfPrompt } from "@helicone-package/cost";
import { providers } from "@helicone-package/cost/providers/mappings";
import { CostData } from "./ModelPriceCalculator"; // Assuming CostData is exported here

// Define and export default token values
export const DEFAULT_INPUT_TOKENS = 100;
export const DEFAULT_OUTPUT_TOKENS = 100;

// Define and export the type for the filter data structure
export type ProviderWithModels = {
  provider: string;
  models: string[];
};

// Server-side function to calculate initial costs
export const getInitialCostData = (): CostData[] => {
  const initialCostData: CostData[] = [];
  const inputTokensNum = DEFAULT_INPUT_TOKENS;
  const outputTokensNum = DEFAULT_OUTPUT_TOKENS;

  providers.forEach((prov) => {
    prov.costs?.forEach((modelCost) => {
      const costDetails = costOf({
        model: modelCost.model.value,
        provider: prov.provider,
      });

      const totalCost = costOfPrompt({
        model: modelCost.model.value,
        provider: prov.provider,
        promptTokens: inputTokensNum,
        promptCacheWriteTokens: 0,
        promptCacheReadTokens: 0,
        completionTokens: outputTokensNum,
        promptAudioTokens: 0,
        completionAudioTokens: 0,
      });

      if (costDetails) {
        const inputCostPer1k = costDetails.prompt_token * 1000;
        const outputCostPer1k = costDetails.completion_token * 1000;
        const inputCost = (inputTokensNum / 1000) * inputCostPer1k;
        const outputCost = (outputTokensNum / 1000) * outputCostPer1k;

        initialCostData.push({
          provider: prov.provider,
          model: modelCost.model.value,
          inputCostPer1k,
          outputCostPer1k,
          inputCost,
          outputCost,
          totalCost: totalCost || 0,
        });
      } else {
        console.warn(
          `[Server Cost Calc] Cost details not found for model: ${modelCost.model.value} by provider: ${prov.provider}`,
        );
      }
    });
  });
  return initialCostData;
};

// Server-side function to prepare data for filters
export const getProviderWithModelsData = (
  costData: CostData[],
): ProviderWithModels[] => {
  const uniqueProviders = Array.from(
    new Set(costData.map((data) => data.provider)),
  ).sort();
  return uniqueProviders.map((provider) => ({
    provider,
    models: costData
      .filter((data) => data.provider === provider)
      .map((data) => data.model),
  }));
};
