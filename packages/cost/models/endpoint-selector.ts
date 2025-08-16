import type { Endpoint, ModelName, ProviderName } from "./types";
import { registry } from "./registry";

export interface EndpointFilters {
  providers?: ProviderName[];
  regions?: string[];
  ptbOnly?: boolean;
}

/**
 * Returns all matching endpoints sorted by cost (cheapest first)
 */
export function selectEndpoints(
  modelName: ModelName,
  filters: EndpointFilters = {}
): Endpoint[] {
  const endpointsResult = registry.getModelEndpoints(modelName);

  if (endpointsResult.error || !endpointsResult.data) {
    return [];
  }

  const endpoints = endpointsResult.data;

  if (endpoints.length === 0) {
    return [];
  }

  const providerSet = filters.providers ? new Set(filters.providers) : null;
  const regionSet = filters.regions ? new Set(filters.regions) : null;

  const result: Endpoint[] = [];

  for (const endpoint of endpoints) {
    if (providerSet && !providerSet.has(endpoint.provider)) continue;
    if (regionSet && endpoint.region && !regionSet.has(endpoint.region))
      continue;
    if (filters.ptbOnly && !endpoint.ptbEnabled) continue;

    result.push(endpoint);
  }

  return result;
}
