/**
 * DeepSeek model definitions
 */

import type { Model } from "../../types";

/**
 * DeepSeek model names as const array
 */
export const deepseekModelNames = [] as const;

export type DeepSeekModelName = (typeof deepseekModelNames)[number];

export const deepseekModels = {} satisfies Record<DeepSeekModelName, Model>;