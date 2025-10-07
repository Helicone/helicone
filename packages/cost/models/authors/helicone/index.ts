/**
 * Helicone test model registry aggregation
 * Test models for development and testing purposes
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

// Import models
import { models as testModels } from "./models";

// Import endpoints
import { endpoints as testEndpoints } from "./endpoints";

// Aggregate models
export const heliconeModels = {
  ...testModels,
} satisfies Record<string, ModelConfig>;

// Aggregate endpoints
export const heliconeEndpointConfig = {
  ...testEndpoints,
} satisfies Record<string, ModelProviderConfig>;
