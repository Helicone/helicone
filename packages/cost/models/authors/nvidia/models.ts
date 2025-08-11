/**
 * Nvidia model definitions
 */

import type { Model } from "../../types";

export const nvidiaModels = {} satisfies Record<string, Model>;

export type NvidiaModelName = keyof typeof nvidiaModels;
