/**
 * MistralAI endpoint configurations
 */

import type { ModelProviderConfig } from "../../types";

export const mistralaiEndpoints = {} satisfies Record<
  string,
  ModelProviderConfig
>;

export type MistralEndpointId = keyof typeof mistralaiEndpoints;
