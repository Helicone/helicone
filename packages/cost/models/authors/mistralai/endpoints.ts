/**
 * MistralAI endpoint configurations
 */

import type { Endpoint, EndpointKey } from "../../types";
import { MistralModelName } from "./models";

export const mistralaiEndpoints = {} satisfies Record<
  EndpointKey<MistralModelName>,
  Endpoint
>;

export type MistralEndpointId = keyof typeof mistralaiEndpoints;
