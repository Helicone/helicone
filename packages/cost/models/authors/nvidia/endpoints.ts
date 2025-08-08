/**
 * Nvidia endpoint configurations
 */

import type { ModelEndpointMap } from "../../types";
import type { NvidiaModelName } from "./models";

export const nvidiaEndpoints = {
  // TODO: Add endpoints for nvidia models
} satisfies Record<NvidiaModelName, ModelEndpointMap>;

export default nvidiaEndpoints;
