import { providers } from "@/packages/cost/providers/mappings";
import { ModelComparisonPage } from "../ModelComparisonPage";
import QueryProvider from "../QueryProvider";

export default async function Home({
  params,
}: {
  params: {
    comparison: string;
  };
}) {
  const [modelAWithProvider, modelBWithProvider] =
    params.comparison.split("-vs-");
  const [modelA, providerA] = modelAWithProvider.split("-on-");
  const [modelB, providerB] = modelBWithProvider.split("-on-");
  const providerInfoA = providers.find(
    (p) => p.provider === providerA.toUpperCase()
  );
  const providerInfoB = providers.find(
    (p) => p.provider === providerB.toUpperCase()
  );

  const modelADetails = providerInfoA?.modelDetails?.[modelA];
  const modelBDetails = providerInfoB?.modelDetails?.[modelB];

  return (
    <QueryProvider>
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
  const mainProviders = providers.filter((provider) =>
    [
      "OPENAI",
      "ANTHROPIC",
      "TOGETHER",
      "FIREWORKS",
      "PERPLEXITY",
      "GOOGLE",
      "OPENROUTER",
      "GROQ",
      // "COHERE",
      // "MISTRAL",
      // "DEEPINFRA",
      // "FIRECRAWL",
      // "QSTASH",
    ].includes(provider.provider)
  );

  // Create a map of model names to their providers
  const modelToProviders = new Map<string, Set<string>>();

  // Collect all unique models and their providers
  mainProviders.forEach((provider) => {
    if (provider.costs) {
      provider.costs.forEach((cost) => {
        const model = cost.model.value;
        if (!modelToProviders.has(model)) {
          modelToProviders.set(model, new Set());
        }
        modelToProviders.get(model)?.add(provider.provider.toLowerCase());
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
