/**
 * Nvidia endpoint configurations
 */

import type { Endpoint, EndpointKey } from "../../types";
import { NvidiaModelName } from "./models";

export const nvidiaEndpoints = {} satisfies Record<
  EndpointKey<NvidiaModelName>,
  Endpoint
>;

export type NvidiaEndpointId = keyof typeof nvidiaEndpoints;
