/**
 * MoonshotAI endpoint configurations
 */

import type { Endpoint } from "../../types";
import type { MoonshotModelName } from "./models";

/**
 * MoonshotAI endpoint IDs
 */
export type MoonshotEndpointId = never;

export const moonshotaiEndpoints = {} satisfies Record<MoonshotEndpointId, Endpoint>;