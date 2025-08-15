/**
 * MoonshotAI endpoint configurations
 */

import type { ModelProviderConfig } from "../../types";
// import { MoonshotModelName } from "./models";

export const moonshotaiEndpoints = {} satisfies Record<
  string,
  ModelProviderConfig
>;

export type MoonshotEndpointId = keyof typeof moonshotaiEndpoints;
