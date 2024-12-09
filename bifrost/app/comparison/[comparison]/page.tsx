import {
  parentModelNames,
  providers,
} from "@/packages/cost/providers/mappings";
import { ModelComparisonPage } from "../ModelComparisonPage";
import QueryProvider from "../QueryProvider";
import Banner from "@/app/components/templates/Banner";

export default async function Home({
  params,
}: {
  params: {
    comparison: string;
  };
}) {
  // Parse the comparison string
  const [modelAWithProvider, modelBWithProvider] =
    params.comparison.split("-vs-");
  const [modelA, providerA] = modelAWithProvider.split("-on-");
  const [modelB, providerB] = modelBWithProvider.split("-on-");

  // Find the provider info
  const providerInfoA = providers.find(
    (p) => p.provider === providerA.toUpperCase()
  );
  const providerInfoB = providers.find(
    (p) => p.provider === providerB.toUpperCase()
  );

  // Helper function to find model details
  const findModelDetails = (providerInfo: any, modelName: string) => {
    // First try direct match
    if (providerInfo?.modelDetails?.[modelName]) {
      return providerInfo.modelDetails[modelName];
    }
    // If no direct match, search through matches
    for (const [parentModel, details] of Object.entries<{ matches: string[] }>(
      providerInfo?.modelDetails || {}
    )) {
      if (details.matches.includes(modelName)) {
        return details;
      }
    }
    return undefined;
  };

  const modelADetails = findModelDetails(providerInfoA, modelA);
  const modelBDetails = findModelDetails(providerInfoB, modelB);

  return (
    <QueryProvider>
      <Banner />
      <div className="container mx-auto py-8">
        <ModelComparisonPage
          modelA={decodeURIComponent(modelA)}
          providerA={decodeURIComponent(providerA.toLowerCase())}
          modelADetails={modelADetails}
          modelB={decodeURIComponent(modelB)}
          providerB={decodeURIComponent(providerB.toLowerCase())}
          modelBDetails={modelBDetails}
        />
      </div>
    </QueryProvider>
  );
}

export async function generateStaticParams() {
  // First, create a flat array of [model, provider] pairs
  const modelProviderPairs: [string, string][] = [];

  providers.forEach((provider) => {
    const providerName = provider.provider.toLowerCase();
    if (provider.modelDetails) {
      Object.entries(provider.modelDetails).forEach(([model, details]) => {
        modelProviderPairs.push([model, providerName]);
        details.matches.forEach((match) => {
          modelProviderPairs.push([match, providerName]);
        });
      });
    }
  });

  const paths = [];

  // Generate combinations with a single nested loop
  for (let i = 0; i < modelProviderPairs.length; i++) {
    for (let j = i + 1; j < modelProviderPairs.length; j++) {
      const [modelA, providerA] = modelProviderPairs[i];
      const [modelB, providerB] = modelProviderPairs[j];

      const modelAPath = `${encodeURIComponent(
        modelA.toLowerCase()
      )}-on-${encodeURIComponent(providerA.toLowerCase())}`;
      const modelBPath = `${encodeURIComponent(
        modelB.toLowerCase()
      )}-on-${encodeURIComponent(providerB.toLowerCase())}`;

      paths.push({
        comparison: `${modelAPath}-vs-${modelBPath}`,
      });
    }
  }

  return paths;
}
