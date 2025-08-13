/**
 * Simple tests for endpoint selector
 */

import { selectEndpoints } from "./endpoint-selector";
import type { ModelName } from "./types";

// Example usage
function demonstrateUsage() {
  // Get all endpoints sorted by cost
  const allEndpoints = selectEndpoints("claude-sonnet-4" as ModelName);
  console.log("All endpoints:", allEndpoints.map(e => ({
    provider: e.provider,
    region: e.region,
    cost: e.pricing.prompt + e.pricing.completion
  })));

  // Get cheapest endpoint (first one)
  const cheapest = allEndpoints[0];
  console.log("Cheapest endpoint:", cheapest?.provider, cheapest?.region);

  // Get PTB-enabled endpoints sorted by cost
  const ptbEndpoints = selectEndpoints("claude-sonnet-4" as ModelName, {
    ptbOnly: true
  });
  console.log("PTB endpoints:", ptbEndpoints.map(e => e.provider));

  // Get endpoints from specific providers
  const providerEndpoints = selectEndpoints("claude-sonnet-4" as ModelName, {
    providers: ["anthropic", "vertex"]
  });
  console.log("Provider endpoints:", providerEndpoints.map(e => ({
    provider: e.provider,
    cost: e.pricing.prompt + e.pricing.completion
  })));

  // For fallback chain - try each endpoint in order
  for (const endpoint of allEndpoints) {
    console.log(`Try ${endpoint.provider} at $${endpoint.pricing.prompt + endpoint.pricing.completion}/M tokens`);
  }
}

export { demonstrateUsage };
