/**
 * MistralAI endpoint configurations
 */

import type { Endpoint } from "../../types";
import type { MistralModelName } from "./models";

/**
 * MistralAI endpoint IDs
 */
export type MistralEndpointId = never;

export const mistralaiEndpoints = {} satisfies Record<MistralEndpointId, Endpoint>;