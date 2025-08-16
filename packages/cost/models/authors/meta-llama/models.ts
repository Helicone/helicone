/**
 * Meta-Llama model definitions
 */

import type { Model } from "../../types";

export const metaLlamaModels = {} satisfies Record<string, Model>;

export type MetaLlamaModelName = keyof typeof metaLlamaModels;
