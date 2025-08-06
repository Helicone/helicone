/**
 * Deepseek model definitions
 */

import { type Model } from '../../types';

/**
 * DeepSeek model names
 */
export type DeepSeekModelName =
  // | "deepseek-r1-distill-qwen-7b"  // TODO: Add endpoints
  // | "deepseek-r1-0528-qwen3-8b:free"  // TODO: Add endpoints
  // | "deepseek-r1-0528-qwen3-8b"  // TODO: Add endpoints
  // | "deepseek-r1-0528:free"  // TODO: Add endpoints
  // | "deepseek-r1-0528"  // TODO: Add endpoints
  // | "deepseek-prover-v2"  // TODO: Add endpoints
  // | "deepseek-v3-base"  // TODO: Add endpoints
  // | "deepseek-chat-v3-0324:free"  // TODO: Add endpoints
  // | "deepseek-chat-v3-0324"  // TODO: Add endpoints
  // | "deepseek-r1-distill-llama-8b"  // TODO: Add endpoints
  // | "deepseek-r1-distill-qwen-1.5b"  // TODO: Add endpoints
  // | "deepseek-r1-distill-qwen-32b"  // TODO: Add endpoints
  // | "deepseek-r1-distill-qwen-14b:free"  // TODO: Add endpoints
  // | "deepseek-r1-distill-qwen-14b"  // TODO: Add endpoints
  // | "deepseek-r1-distill-llama-70b:free"  // TODO: Add endpoints
  // | "deepseek-r1-distill-llama-70b"  // TODO: Add endpoints
  // | "deepseek-r1:free"  // TODO: Add endpoints
  // | "deepseek-r1"  // TODO: Add endpoints
  // | "deepseek-chat"  // TODO: Add endpoints
  never;

export const deepseekModels = {
  // TODO: Add models when endpoints are available
} satisfies Record<DeepSeekModelName, Model>;

export default deepseekModels;