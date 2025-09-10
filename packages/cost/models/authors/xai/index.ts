/**
 * Grok (xAI) model registry aggregation
 * Combines all models and endpoints from Grok
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models and endpoints
import { models as grokModels } from "./models";
import { endpoints as grokEndpoints } from "./endpoints";

// Re-export models
export { grokModels };

// Export aggregated endpoints
export const grokEndpointConfig = grokEndpoints;
