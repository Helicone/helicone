/**
 * MoonshotAI model definitions
 */

import type { Model } from "../../types";

/**
 * MoonshotAI model names as const array
 */
export const moonshotaiModelNames = [] as const;

export type MoonshotModelName = (typeof moonshotaiModelNames)[number];

export const moonshotaiModels = {} satisfies Record<MoonshotModelName, Model>;