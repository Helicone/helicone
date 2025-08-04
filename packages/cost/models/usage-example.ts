#!/usr/bin/env tsx
/**
 * Usage examples for the model-centric cost system
 * Demonstrates all key features and common use cases
 */

import { modelRegistry } from "./registry";
import {
  buildModelLookupMap,
  buildModelIndices,
  getModel,
  getProviderSummary,
  getModelProviders,
  findModels,
  getModelFamily,
  getModelVariants,
} from "./utils";
import type { ProviderName } from "./types";

console.log("=== Helicone Model Cost System Usage Examples ===\n");

// Initialize the system
console.log("1. Initializing lookup structures...");
const lookupMap = buildModelLookupMap(modelRegistry);
const indices = buildModelIndices(modelRegistry);
console.log(`   ✓ Loaded ${Object.keys(modelRegistry.models).length} base models`);
console.log(`   ✓ Loaded ${Object.keys(modelRegistry.variants).length} variants`);
console.log(`   ✓ Built lookup map with ${Object.keys(lookupMap).length} total entries\n`);

// Example 1: Basic model lookup
console.log("2. Basic Model Lookups:");
console.log("   a) Get a base model (gpt-4):");
const gpt4 = getModel(modelRegistry, "gpt-4");
if (gpt4) {
  console.log(`      Name: ${gpt4.metadata.displayName}`);
  console.log(`      Context: ${gpt4.metadata.contextWindow.toLocaleString()} tokens`);
  console.log(`      Providers: ${Object.keys(gpt4.providers).join(", ")}`);
  console.log(`      OpenAI Cost: $${(gpt4.providers.openai?.cost.prompt_token || 0).toFixed(2)}/M input tokens`);
}

console.log("\n   b) Get a model with slash in name (gpt-3.5-turbo):");
const gpt35 = getModel(modelRegistry, "gpt-3.5-turbo");
if (gpt35) {
  console.log(`      Name: ${gpt35.metadata.displayName}`);
  console.log(`      Context: ${gpt35.metadata.contextWindow.toLocaleString()} tokens`);
  console.log(`      Cost: $${(gpt35.providers.openai?.cost.prompt_token || 0).toFixed(2)}/M input`);
}

// Example 2: Provider lookups
console.log("\n3. Provider-Centric Queries:");
console.log("   a) All models available on Groq:");
const groqSummary = getProviderSummary(modelRegistry, indices, "groq");
if (groqSummary) {
  console.log(`      Total models: ${groqSummary.modelCount}`);
  // Filter out special -1 costs for price range
  const validCosts = groqSummary.models
    .map(m => m.cost.prompt_token)
    .filter(cost => cost >= 0);
  if (validCosts.length > 0) {
    console.log(`      Price range: $${Math.min(...validCosts).toFixed(4)} - $${Math.max(...validCosts).toFixed(4)}/M tokens`);
  }
  console.log(`      Sample models:`);
  groqSummary.models
    .filter(m => m.cost.prompt_token >= 0) // Show only models with valid costs
    .slice(0, 3)
    .forEach(m => {
      console.log(`        - ${m.displayName} (${m.creator}): $${(m.cost.prompt_token).toFixed(4)}/M`);
    });
}

// Example 3: Model comparison across providers
console.log("\n4. Model Price Comparison:");
// Use a model that has multiple providers
const modelToCompare = "gpt-4-turbo";
const modelProviders = getModelProviders(modelRegistry, modelToCompare);
if (modelProviders) {
  console.log(`   ${modelProviders.displayName} available from:`);
  modelProviders.providers.forEach(p => {
    console.log(`     - ${p.provider}: $${(p.cost.prompt_token).toFixed(2)}/M input, $${(p.cost.completion_token).toFixed(2)}/M output`);
  });
} else {
  console.log(`   Model ${modelToCompare} not found`);
}

// Example 4: Model families
console.log("\n5. Model Families (base + variants):");
const families = ["gpt-4", "claude-opus-4", "llama-3.1-8b"];
families.forEach(familyId => {
  const family = getModelFamily(modelRegistry, familyId);
  if (family) {
    console.log(`   ${family.base.metadata.displayName}:`);
    console.log(`     Base model: ${family.base.id}`);
    console.log(`     Variants: ${family.variants.length}`);
    if (family.variants.length > 0) {
      const withOverrides = family.variants.filter(v => v.providers).length;
      const inherited = family.variants.filter(v => !v.providers).length;
      console.log(`       - ${withOverrides} with cost overrides`);
      console.log(`       - ${inherited} with inherited costs`);
    }
  }
});

// Example 5: Search and filter
console.log("\n6. Search and Filter Models:");
console.log("   a) Find all Anthropic models with 100k+ context:");
const largeAnthropicModels = findModels(modelRegistry, indices, {
  creator: "Anthropic",
  minContextWindow: 100000,
});
console.log(`      Found ${largeAnthropicModels.length} models:`);
largeAnthropicModels.forEach(m => {
  console.log(`        - ${m.metadata.displayName}: ${m.metadata.contextWindow.toLocaleString()} tokens`);
});

console.log("\n   b) Find cheapest models on any provider:");
const allModels = findModels(modelRegistry, indices, {});
const cheapestModels = allModels
  .map(m => ({
    model: m,
    minCost: Math.min(...Object.values(m.providers).map(p => p.cost.prompt_token)),
  }))
  .filter(({ minCost }) => minCost >= 0) // Filter out special -1 costs
  .sort((a, b) => a.minCost - b.minCost)
  .slice(0, 5);

console.log(`      Top 5 cheapest models (excluding dynamic pricing):`);
cheapestModels.forEach(({ model, minCost }) => {
  console.log(`        - ${model.metadata.displayName}: $${(minCost).toFixed(4)}/M tokens`);
});

// Example 6: Cost calculation helper
console.log("\n7. Cost Calculation Example:");
function calculateCost(modelId: string, inputTokens: number, outputTokens: number, provider: ProviderName = "openai") {
  const model = getModel(modelRegistry, modelId);
  if (!model || !model.providers[provider]) {
    return null;
  }
  
  const costs = model.providers[provider].cost;
  const inputCost = (inputTokens / 1_000_000) * costs.prompt_token;
  const outputCost = (outputTokens / 1_000_000) * costs.completion_token;
  
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

const usage = { input: 1000, output: 500 };
["gpt-4", "gpt-3.5-turbo", "claude-opus-4"].forEach(modelId => {
  const cost = calculateCost(modelId, usage.input, usage.output);
  if (cost) {
    console.log(`   ${modelId}: $${cost.totalCost.toFixed(4)} (${usage.input} in + ${usage.output} out)`);
  }
});

// Example 7: Statistics
console.log("\n8. System Statistics:");
console.log(`   Total unique models: ${Object.keys(lookupMap).length}`);
console.log(`   Base models: ${Object.keys(modelRegistry.models).length}`);
console.log(`   Variants: ${Object.keys(modelRegistry.variants).length}`);
console.log(`     - Pure inheritance: ${Object.values(modelRegistry.variants).filter(v => !v.providers).length}`);
console.log(`     - With overrides: ${Object.values(modelRegistry.variants).filter(v => v.providers).length}`);

// Import the pre-calculated stats
import { modelCountByCreator, modelCountByProvider } from "./registry";

console.log("\n   Models by creator (top 5):");
Object.entries(modelCountByCreator)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5)
  .forEach(([creator, count]) => {
    console.log(`     ${creator}: ${count}`);
  });

console.log("\n   Models by provider (top 5):");
Object.entries(modelCountByProvider)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5)
  .forEach(([provider, count]) => {
    console.log(`     ${provider}: ${count}`);
  });

// Performance test
console.log("\n9. Performance Test:");
const iterations = 10000;
const start = performance.now();
for (let i = 0; i < iterations; i++) {
  getModel(modelRegistry, "gpt-4");
  getModel(modelRegistry, "claude-3-opus-20240229");
  getModel(modelRegistry, "llama-3.1-70b-instruct");
}
const end = performance.now();
console.log(`   ${iterations * 3} lookups in ${(end - start).toFixed(2)}ms`);
console.log(`   Average: ${((end - start) / (iterations * 3)).toFixed(4)}ms per lookup`);
console.log(`   Throughput: ${Math.round((iterations * 3) / ((end - start) / 1000)).toLocaleString()} lookups/second`);

console.log("\n✨ Examples complete!");