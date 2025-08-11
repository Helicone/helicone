/**
 * Simple endpoint selector for load balancing between multiple endpoints
 */

import type { Endpoint, ModelName, ProviderName } from "./types";
import { registry } from "./registry";

export interface EndpointFilters {
  providers?: ProviderName[];
  regions?: string[];
  ptbOnly?: boolean;
}

/**
 * Select all endpoints for load balancing and fallbacks
 * Returns all matching endpoints sorted by cost (cheapest first)
 */
export function selectEndpoints(
  modelName: ModelName,
  filters: EndpointFilters = {}
): Endpoint[] {
  // Get all endpoints for the model (already sorted by cost)
  const endpoints = registry.getModelEndpoints(modelName);

  if (endpoints.length === 0) {
    return [];
  }

  const providerSet = filters.providers ? new Set(filters.providers) : null;
  const regionSet = filters.regions ? new Set(filters.regions) : null;

  const result: Endpoint[] = [];

  // Collect all endpoints that pass filters
  for (const endpoint of endpoints) {
    if (providerSet && !providerSet.has(endpoint.provider)) continue;
    if (regionSet && endpoint.region && !regionSet.has(endpoint.region))
      continue;
    if (filters.ptbOnly && !endpoint.ptbEnabled) continue;

    result.push(endpoint);
  }

  return result;
}
