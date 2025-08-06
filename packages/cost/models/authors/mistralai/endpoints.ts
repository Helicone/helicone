/**
 * Mistral AI endpoint configurations
 */

import type { ModelEndpoint } from "../../types";
import type { MistralModelName } from "./models";

export const mistralaiEndpoints = {
  // TODO: Add endpoints for mistral models
} satisfies Record<MistralModelName, ModelEndpoint[]>;

export default mistralaiEndpoints;
