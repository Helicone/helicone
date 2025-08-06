/**
 * Mistral AI endpoint configurations
 */

import type { ModelEndpointMap } from "../../types";
import type { MistralModelName } from "./models";

export const mistralaiEndpoints = {
  // TODO: Add endpoints for mistral models
} satisfies Record<MistralModelName, ModelEndpointMap>;

export default mistralaiEndpoints;
