import type { ModelConfig, ModelProviderConfig } from "../../../types";

// Import models and endpoints
import { models as canopywaveModels } from "./models";
import { endpoints as canopywaveEndpoints } from "./endpoints";

// Re-export models
export { canopywaveModels };

// Export aggregated endpoints
export const canopywaveEndpointConfig = canopywaveEndpoints;
