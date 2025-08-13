/**
 * MistralAI model definitions
 */

import type { Model } from "../../types";

export const mistralaiModels = {} satisfies Record<string, Model>;

export type MistralModelName = keyof typeof mistralaiModels;
