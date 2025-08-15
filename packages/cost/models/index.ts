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
  getPtbEndpoint,
  getPtbEndpoints,
  getPtbEndpointsByProvider,
  getProviderModels,
  getModelProviderConfig,
  getModelProviderConfigs,
} from "./registry";

// Backward compatibility aliases for worker
export { getPtbEndpoints as getEndpoints } from "./registry";
export type { Endpoint as ModelProvider } from "./types";

// Export provider utilities
export { getProvider, buildEndpointUrl, buildModelId } from "./providers";
