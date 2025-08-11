/**
 * MoonshotAI model definitions
 */

import type { Model } from "../../types";

export const moonshotaiModels = {} satisfies Record<string, Model>;

export type MoonshotModelName = keyof typeof moonshotaiModels;
