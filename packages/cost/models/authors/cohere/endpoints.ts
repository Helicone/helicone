/**
 * Cohere endpoint configurations
 */

import type { ModelEndpointMap } from "../../types";
import type { CohereModelName } from "./models";

export const cohereEndpoints = {} satisfies Record<
  CohereModelName,
  ModelEndpointMap
>;

export default cohereEndpoints;
