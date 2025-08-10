/**
 * Nvidia model definitions
 */

import type { Model } from "../../types";

/**
 * Nvidia model names as const array
 */
export const nvidiaModelNames = [] as const;

export type NvidiaModelName = (typeof nvidiaModelNames)[number];

export const nvidiaModels = {} satisfies Record<NvidiaModelName, Model>;