/**
 * Meta-Llama endpoint configurations
 */

import type { ModelProviderConfig } from "../../types";

export const metaLlamaEndpoints = {} satisfies Record<
  string,
  ModelProviderConfig
>;

export type MetaLlamaEndpointId = keyof typeof metaLlamaEndpoints;
