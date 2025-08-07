/**
 * Metallama model definitions
 */

import { type Model } from '../../types';

/**
 * Meta-Llama model names
 */
export type MetaLlamaModelName =
  // | "llama-guard-4-12b"  // TODO: Add endpoints
  // | "llama-4-maverick"  // TODO: Add endpoints
  // | "llama-4-scout"  // TODO: Add endpoints
  // | "llama-guard-3-8b"  // TODO: Add endpoints
  // | "llama-3.3-70b-instruct:free"  // TODO: Add endpoints
  // | "llama-3.3-70b-instruct"  // TODO: Add endpoints
  // | "llama-3.2-3b-instruct:free"  // TODO: Add endpoints
  // | "llama-3.2-3b-instruct"  // TODO: Add endpoints
  // | "llama-3.2-11b-vision-instruct:free"  // TODO: Add endpoints
  // | "llama-3.2-11b-vision-instruct"  // TODO: Add endpoints
  // | "llama-3.2-90b-vision-instruct"  // TODO: Add endpoints
  // | "llama-3.2-1b-instruct"  // TODO: Add endpoints
  // | "llama-3.1-405b"  // TODO: Add endpoints
  // | "llama-3.1-405b-instruct:free"  // TODO: Add endpoints
  // | "llama-3.1-405b-instruct"  // TODO: Add endpoints
  // | "llama-3.1-8b-instruct"  // TODO: Add endpoints
  // | "llama-3.1-70b-instruct"  // TODO: Add endpoints
  // | "llama-guard-2-8b"  // TODO: Add endpoints
  // | "llama-3-70b-instruct"  // TODO: Add endpoints
  // | "llama-3-8b-instruct"  // TODO: Add endpoints
  never;

export const metaLlamaModels = {
  // TODO: Add models when endpoints are available
} satisfies Record<MetaLlamaModelName, Model>;

export default metaLlamaModels;