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
          providerA={decodeURIComponent(providerA)}
          modelADetails={modelADetails}
          modelB={decodeURIComponent(modelB)}
          providerB={decodeURIComponent(providerB)}
          modelBDetails={modelBDetails}
        />
      </div>
    </QueryProvider>
  );
}

export async function generateStaticParams() {
  // Create a map of model names to their providers
  const modelToProviders = new Map<string, Set<string>>();

  providers.forEach((provider) => {
    if (provider.modelDetails) {
      Object.entries(provider.modelDetails).forEach(([model, details]) => {
        modelToProviders.set(model, new Set([provider.provider]));
        details.matches.forEach((match) => {
          modelToProviders.set(match, new Set([provider.provider]));
        });
      });
    }
  });

  const paths = [];
  const uniqueModels = Array.from(modelToProviders.keys());

  for (let i = 0; i < uniqueModels.length; i++) {
    for (let j = i + 1; j < uniqueModels.length; j++) {
      const modelA = uniqueModels[i];
      const modelB = uniqueModels[j];
      const providersA = modelToProviders.get(modelA)!;
      const providersB = modelToProviders.get(modelB)!;

      // Create URL-safe versions
      const modelAPath = `${encodeURIComponent(modelA)}-on-${encodeURIComponent(
        Array.from(providersA)[0]
      )}`;
      const modelBPath = `${encodeURIComponent(modelB)}-on-${encodeURIComponent(
        Array.from(providersB)[0]
      )}`;

      paths.push({
        comparison: `${modelAPath}-vs-${modelBPath}`,
      });
    }
  }

  return paths;
}
