/**
 * Nvidia endpoint configurations
 */

import type { ModelEndpoint } from "../../types";
import type { NvidiaModelName } from "./models";

export const nvidiaEndpoints = {
  // TODO: Add endpoints for nvidia models
} satisfies Record<NvidiaModelName, ModelEndpoint[]>;

export default nvidiaEndpoints;
