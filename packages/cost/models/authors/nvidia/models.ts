/**
 * Nvidia model definitions
 */

import { type Model } from '../../types';

/**
 * Nvidia model names
 */
export type NvidiaModelName =
  // | "llama-3.3-nemotron-super-49b-v1"  // TODO: Add endpoints
  // | "llama-3.1-nemotron-ultra-253b-v1:free"  // TODO: Add endpoints
  // | "llama-3.1-nemotron-ultra-253b-v1"  // TODO: Add endpoints
  // | "llama-3.1-nemotron-70b-instruct"  // TODO: Add endpoints
  never;

export const nvidiaModels = {
  // TODO: Add models when endpoints are available
} satisfies Record<NvidiaModelName, Model>;

export default nvidiaModels;