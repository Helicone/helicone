/**
 * Meta-Llama endpoint configurations
 */

import type { Endpoint } from "../../types";

/**
 * Meta-Llama endpoint IDs
 */
export type MetaLlamaEndpointId = never;

export const metaLlamaEndpoints = {} satisfies Record<
  MetaLlamaEndpointId,
  Endpoint
>;
