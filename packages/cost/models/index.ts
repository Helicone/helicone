/**
 * Model Registry v2 - Flat Structure
 *
 * Main entry point for the model registry
 */

// Export all types
export * from "./types";

// Re-export Result type from common package
export * from "../../common/result";

// Export registry and convenience functions
export {
  registry,
  getModel,
  getAllModels,
  getAllModelIds,
  getAllModelsWithIds,
  getPtbEndpoints,
  getPtbEndpointById,
  getPtbEndpointsByModel,
  getPtbEndpointsByProvider,
  getProviderModels,
  getModelProviderConfig,
  getModelProviderConfigs,
  type ModelName,
  type ModelProviderConfigId,
  type EndpointId,
} from "./registry";

export type { Endpoint, ModelProviderConfig, ProviderConfig } from "./types";

// Export provider utilities
export {
  getProvider,
  buildEndpointUrl,
  buildModelId,
  type ProviderName,
} from "./providers";
