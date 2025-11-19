/**
 * Perplexity model registry aggregation
 * Combines all models and endpoints from Perplexity
 */

import type { ModelConfig, ModelProviderConfig } from "../../../types";

// Import models and endpoints
import { models as perplexityModels } from "./models";
import { endpoints as perplexityEndpoints } from "./endpoints";

// Re-export models
export { perplexityModels };

// Export aggregated endpoints
export const perplexityEndpointConfig = perplexityEndpoints;
