/**
 * MistralAI model definitions
 */

import type { Model } from "../../types";

/**
 * MistralAI model names as const array
 */
export const mistralaiModelNames = [] as const;

export type MistralModelName = (typeof mistralaiModelNames)[number];

export const mistralaiModels = {} satisfies Record<MistralModelName, Model>;