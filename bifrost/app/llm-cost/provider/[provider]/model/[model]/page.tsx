import { providers } from "@/packages/cost/providers/mappings";
import ModelPriceCalculator from "../../../../ModelPriceCalculator";

export default async function Home({
  params,
}: {
  params: {
    model: string;
    provider: string;
  };
}) {
  const { model: model, provider: provider } = params;
  const decodedModel = decodeURIComponent(model || "");
  const decodedProvider = decodeURIComponent(provider || "");

  return (
    <>
      <div className="container mx-auto py-8">
        <ModelPriceCalculator model={decodedModel} provider={decodedProvider} />
      </div>
    </>
  );
}

export async function generateStaticParams() {
  const paths = [];

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
