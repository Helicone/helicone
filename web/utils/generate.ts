import { modelMapping } from "packages/cost/unified/models";
import { providerConfigs } from "packages/cost/unified/providers";
import { Provider } from "packages/cost/unified/types";
import { Message } from "packages/llm-mapper/types";
import findBestMatch from "string-similarity-js";

/**
 * Find the closest matching provider from a string input
 * @param provider The provider string to match
 * @returns The closest matching Provider type
 */
export function findClosestProvider(provider: string): Provider {
  const providers = Object.keys(providerConfigs) as Provider[];

  // Check for exact match first (uppercase)
  const normalizedProvider = provider.trim().toUpperCase();
  const exactMatch = providers.find((p) => p === normalizedProvider);
  if (exactMatch) {
    return exactMatch;
  }

  // If not found: find and return the closest match
  const similarities = providers.map((p) => ({
    target: p,
    similarity: findBestMatch(provider, p),
  }));
  const closestMatch = similarities.reduce((best, current) =>
    current.similarity > best.similarity ? current : best
  );
  return closestMatch.target as Provider;
}

/**
 * Find the closest matching model string for a given provider
 * @param provider The provider to search models for
 * @param model The model string to match
 * @returns The closest matching model string
 */
export function findClosestModel(provider: Provider, model: string): string {
  // Collect all model strings for the given provider
  const modelStrings: string[] = [];

  // Iterate through all creators and their models
  Object.values(modelMapping).forEach((creatorModels) => {
    Object.values(creatorModels).forEach((modelConfig) => {
      // Find provider models that match our provider
      const providerModels = modelConfig.providers.filter(
        (pm) => pm.provider === provider
      );

      // Add their model strings to our collection
      providerModels.forEach((pm) => {
        modelStrings.push(pm.modelString);
      });
    });
  });

  // Check for exact match first (case insensitive)
  const normalizedModel = model.trim().toLowerCase();
  const exactMatch = modelStrings.find(
    (m) => m.toLowerCase() === normalizedModel
  );
  if (exactMatch) {
    return exactMatch;
  }

  // If not found: find and return the closest match
  if (modelStrings.length === 0) {
    return model; // Return original if no models found for provider
  }

  const similarities = modelStrings.map((m) => ({
    target: m,
    similarity: findBestMatch(model, m),
  }));
  const closestMatch = similarities.reduce((best, current) =>
    current.similarity > best.similarity ? current : best
  );
  return closestMatch.target;
}

// Helper functions for creating message objects
export function $system(content: string): Message {
  return { _type: "message", role: "system", content };
}
export function $user(content: string): Message {
  return { _type: "message", role: "user", content };
}
export function $assistant(content: string): Message {
  return { _type: "message", role: "assistant", content };
}
