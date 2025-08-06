/**
 * Meta-Llama endpoint configurations
 */

import type { ModelEndpointMap } from "../../types";
import type { MetaLlamaModelName } from "./models";

export const metaLlamaEndpoints = {
  // TODO: Add endpoints for meta-llama models
} satisfies Record<MetaLlamaModelName, ModelEndpointMap>;

export default metaLlamaEndpoints;
