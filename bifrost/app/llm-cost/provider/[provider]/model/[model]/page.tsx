import ModelPriceCalculator, {
  CostData,
} from "../../../../ModelPriceCalculator";
import {
  getInitialCostData,
  getProviderWithModelsData,
  DEFAULT_INPUT_TOKENS,
  DEFAULT_OUTPUT_TOKENS,
  ProviderWithModels,
} from "../../../../utils";
import { notFound } from "next/navigation";
import { providers } from "@helicone-package/cost/providers/mappings";
export default async function ModelCostPage({
  params,
}: {
  params: {
    model: string;
    provider: string;
  };
}) {
  const { provider, model } = params;
  const decodedModel = decodeURIComponent(model || "");
  const decodedProvider = decodeURIComponent(provider || "");
  const initialCostData = getInitialCostData();
  const providerWithModels = getProviderWithModelsData(initialCostData);
  const modelExists = initialCostData.some(
    (d: CostData) =>
      d.provider.toLowerCase() === decodedProvider.toLowerCase() &&
      d.model.toLowerCase() === decodedModel.toLowerCase(),
  );
  if (!modelExists) {
    const providerExists = providerWithModels.some(
      (p: ProviderWithModels) =>
        p.provider.toLowerCase() === decodedProvider.toLowerCase(),
    );
    if (!providerExists) {
      notFound();
    }
  }

  return (
    <>
      <div className="container mx-auto py-8">
        <ModelPriceCalculator
          model={decodedModel}
          provider={decodedProvider}
          initialCostData={initialCostData}
          defaultInputTokens={DEFAULT_INPUT_TOKENS}
          defaultOutputTokens={DEFAULT_OUTPUT_TOKENS}
          providerWithModels={providerWithModels}
        />
      </div>
    </>
  );
}

export async function generateStaticParams() {
  const paths: { provider: string; model: string }[] = [];

  for (const provider of providers) {
    for (const cost of provider.costs || []) {
      paths.push({
        provider: encodeURIComponent(provider.provider.toLowerCase()),
        model: encodeURIComponent(cost.model.value),
      });
    }

    if (provider.modelDetails) {
      for (const parentModel in provider.modelDetails) {
        const searchTerms = provider.modelDetails[parentModel].searchTerms;
        if (searchTerms && searchTerms.length > 0) {
          paths.push({
            provider: encodeURIComponent(provider.provider.toLowerCase()),
            model: encodeURIComponent(searchTerms[0]),
          });
        }
      }
    }
  }

  return paths;
}
