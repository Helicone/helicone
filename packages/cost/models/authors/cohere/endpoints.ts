/**
 * Cohere endpoint configurations
 */

import type { Endpoint } from "../../types";
import type { CohereModelName } from "./models";

/**
 * Cohere endpoint IDs
 */
export type CohereEndpointId = never;

export const cohereEndpoints = {} satisfies Record<CohereEndpointId, Endpoint>;