import { providers } from "@helicone-package/cost/providers/mappings";

export function getProviderLogo(provider: string): string {
  const logoMap: Record<string, string> = {
    openai: "/static/home/chatgpt.webp",
    anthropic: "/static/home/anthropic.webp",
    google: "/static/home/gemini.webp",
    meta: "/static/home/logo2.webp",
    mistral: "/static/home/mistral.webp",
    cohere: "/static/home/logo3.webp",
    groq: "/static/home/groq.svg",
    together: "/static/home/logo4.webp",
    openrouter: "/static/home/logo4.webp",
  };

  return logoMap[provider.toLowerCase()] || "/static/home/logo4.webp"; // Default logo
}

export interface ModelFamily {
  id: string;
  name: string;
  provider: {
    id: string;
    name: string;
    logo: string;
  };
  variants: string[];
  benchmarks: Record<string, number>;
  description: string;
  capabilities: string[];
}

export function getModelFamilies(): ModelFamily[] {
  const families: ModelFamily[] = [];

  for (const provider of providers) {
    if (!provider.modelDetails) continue;

    const providerName = provider.provider;

    for (const [parentModel, details] of Object.entries(
      provider.modelDetails
    )) {
      families.push({
        id: parentModel,
        name: parentModel,
        provider: {
          id: providerName.toLowerCase(),
          name: providerName,
          logo: getProviderLogo(providerName),
        },
        variants: details.matches,
        benchmarks: details.info.benchmarks || {},
        description: details.info.description || "",
        capabilities: details.info.capabilities || [],
      });
    }
  }

  return families;
}

// Get all popular models for display in the UI
export function getPopularModels(): {
  id: string;
  name: string;
  provider: string;
  logo: string;
}[] {
  const families = getModelFamilies();

  // Return a flattened list of popular models for the UI
  return families.map((family) => ({
    id: family.id,
    name: family.name,
    provider: family.provider.name,
    logo: family.provider.logo,
  }));
}

// Find a model by ID (matches either parent or variant)
export function findModelById(modelId: string): ModelFamily | null {
  const families = getModelFamilies();

  for (const family of families) {
    if (family.id === modelId) return family;

    // Check if it's a variant
    if (family.variants.includes(modelId)) return family;
  }

  return null;
}

// Create a URL-friendly comparison path
export function createComparisonPath(
  model1Id: string,
  model2Id: string
): string {
  const model1 = findModelById(model1Id);
  const model2 = findModelById(model2Id);

  if (!model1 || !model2) return "#";

  const model1Path = `${encodeURIComponent(
    model1.name
  )}-on-${encodeURIComponent(model1.provider.id)}`;

  const model2Path = `${encodeURIComponent(
    model2.name
  )}-on-${encodeURIComponent(model2.provider.id)}`;

  return `/comparison/${model1Path}-vs-${model2Path}`;
}
