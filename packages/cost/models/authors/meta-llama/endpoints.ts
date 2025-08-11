/**
 * Meta-Llama endpoint configurations
 */

import type { Endpoint, EndpointKey } from "../../types";
import { MetaLlamaModelName } from "./models";

export const metaLlamaEndpoints = {} satisfies Record<
  EndpointKey<MetaLlamaModelName>,
  Endpoint
>;

export type MetaLlamaEndpointId = keyof typeof metaLlamaEndpoints;
