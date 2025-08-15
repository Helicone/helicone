/**
 * Nvidia endpoint configurations
 */

import type { ModelProviderConfig } from "../../types";

export const nvidiaEndpoints = {} satisfies Record<string, ModelProviderConfig>;

export type NvidiaEndpointId = keyof typeof nvidiaEndpoints;
