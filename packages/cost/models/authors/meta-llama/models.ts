/**
 * Meta-Llama model definitions
 */

import type { Model } from "../../types";

/**
 * Meta-Llama model names as const array
 */
export const metaLlamaModelNames = [] as const;

export type MetaLlamaModelName = (typeof metaLlamaModelNames)[number];

export const metaLlamaModels = {} satisfies Record<MetaLlamaModelName, Model>;