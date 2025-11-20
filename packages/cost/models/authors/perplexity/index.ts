/**
 * Perplexity model registry aggregation
 * Combines all models and endpoints from Perplexity
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models and endpoints from sonar
import { perplexityModels, perplexityEndpointConfig } from "./sonar";

// Re-export models and endpoints
export { perplexityModels, perplexityEndpointConfig };
