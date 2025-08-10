/**
 * Cohere model definitions
 */

import type { Model } from "../../types";

/**
 * Cohere model names as const array
 */
export const cohereModelNames = [] as const;

export type CohereModelName = (typeof cohereModelNames)[number];

export const cohereModels = {} satisfies Record<CohereModelName, Model>;