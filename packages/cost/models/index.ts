/**
 * Model Registry v2 - Flat Structure
 *
 * Main entry point for the model registry
 */

// Export all types
export * from "./types";

// Export registry and convenience functions
export {
  registry,
  getModel,
  getAllModels,
  getEndpoint,
  getModelEndpoints,
  getPtbEndpoints,
  getByokEndpoints,
  getProviderModels,
  hasPtbSupport,
  getCheapestEndpoint,
} from "./registry";

// Export provider utilities
export { getProvider, buildEndpointUrl, buildModelId } from "./providers";
