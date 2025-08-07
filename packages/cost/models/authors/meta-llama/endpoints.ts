/**
 * Meta-Llama endpoint configurations
 */

import type { ModelEndpoint } from "../../types";
import type { MetaLlamaModelName } from "./models";

export const metaLlamaEndpoints = {
  // TODO: Add endpoints for meta-llama models
} satisfies Record<MetaLlamaModelName, ModelEndpoint[]>;

export default metaLlamaEndpoints;
