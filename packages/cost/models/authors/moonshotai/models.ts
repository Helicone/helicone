/**
 * Moonshotai model definitions
 */

import { type Model } from '../../types';

/**
 * Moonshot AI model names
 */
export type MoonshotModelName =
  // | "kimi-k2:free"  // TODO: Add endpoints
  // | "kimi-k2"  // TODO: Add endpoints
  // | "kimi-dev-72b:free"  // TODO: Add endpoints
  // | "kimi-vl-a3b-thinking:free"  // TODO: Add endpoints
  // | "kimi-vl-a3b-thinking"  // TODO: Add endpoints
  never;

export const moonshotaiModels = {
  // TODO: Add models when endpoints are available
} satisfies Record<MoonshotModelName, Model>;

export default moonshotaiModels;