import { providers } from "@/packages/cost/providers/mappings";
import ModelPriceCalculator, {
  formatProviderName,
} from "../../../../ModelPriceCalculator";

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
        provider: encodeURIComponent(provider.provider),
        model: formatProviderName(encodeURIComponent(cost.model.value)),
      });
    }
  }

  return paths;
}
