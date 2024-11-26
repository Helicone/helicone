import { providers } from "@/packages/cost/providers/mappings";
import { ModelComparisonPage } from "../ModelComparisonPage";

export default async function Home({
  params,
}: {
  params: {
    comparison: string;
  };
}) {
  const [modelA, modelB] = params.comparison.split("-vs-");

  return (
    <div className="container mx-auto py-8">
      <ModelComparisonPage
        modelA={decodeURIComponent(modelA)}
        modelB={decodeURIComponent(modelB)}
      />
    </div>
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

  // Generate comparisons between different models
  for (let i = 0; i < uniqueModels.length; i++) {
    for (let j = i + 1; j < uniqueModels.length; j++) {
      const modelA = uniqueModels[i];
      const modelB = uniqueModels[j];

      // Get all providers for each model
      // const providersA = modelToProviders.get(modelA)!;
      // const providersB = modelToProviders.get(modelB)!;

      // Use the first provider for each model
      paths.push({
        modelA: encodeURIComponent(modelA),
        modelB: encodeURIComponent(modelB),
      });
    }
  }

  return paths;
}
