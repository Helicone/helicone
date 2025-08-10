/**
 * DeepSeek endpoint configurations
 */

import type { Endpoint } from "../../types";
import type { DeepSeekModelName } from "./models";

/**
 * DeepSeek endpoint IDs
 */
export type DeepSeekEndpointId = never;

export const deepseekEndpoints = {} satisfies Record<DeepSeekEndpointId, Endpoint>;