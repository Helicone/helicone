/**
 * MoonshotAI endpoint configurations
 */

import type { Endpoint, EndpointKey } from "../../types";
import { MoonshotModelName } from "./models";

export const moonshotaiEndpoints = {} satisfies Record<
  EndpointKey<MoonshotModelName>,
  Endpoint
>;

export type MoonshotEndpointId = keyof typeof moonshotaiEndpoints;
