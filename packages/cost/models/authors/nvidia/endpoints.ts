/**
 * Nvidia endpoint configurations
 */

import type { Endpoint } from "../../types";
import type { NvidiaModelName } from "./models";

/**
 * Nvidia endpoint IDs
 */
export type NvidiaEndpointId = never;

export const nvidiaEndpoints = {} satisfies Record<NvidiaEndpointId, Endpoint>;