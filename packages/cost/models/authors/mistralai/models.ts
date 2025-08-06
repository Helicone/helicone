/**
 * Mistralai model definitions
 */

import { type Model } from '../../types';

/**
 * Mistral model names
 */
export type MistralModelName =
  // | "codestral-2508"  // TODO: Add endpoints
  // | "devstral-medium"  // TODO: Add endpoints
  // | "devstral-small"  // TODO: Add endpoints
  // | "mistral-small-3.2-24b-instruct:free"  // TODO: Add endpoints
  // | "mistral-small-3.2-24b-instruct"  // TODO: Add endpoints
  // | "magistral-small-2506"  // TODO: Add endpoints
  // | "magistral-medium-2506"  // TODO: Add endpoints
  // | "magistral-medium-2506:thinking"  // TODO: Add endpoints
  // | "devstral-small-2505:free"  // TODO: Add endpoints
  // | "devstral-small-2505"  // TODO: Add endpoints
  // | "mistral-medium-3"  // TODO: Add endpoints
  // | "mistral-small-3.1-24b-instruct:free"  // TODO: Add endpoints
  // | "mistral-small-3.1-24b-instruct"  // TODO: Add endpoints
  // | "mistral-saba"  // TODO: Add endpoints
  // | "mistral-small-24b-instruct-2501:free"  // TODO: Add endpoints
  // | "mistral-small-24b-instruct-2501"  // TODO: Add endpoints
  // | "codestral-2501"  // TODO: Add endpoints
  // | "mistral-large-2411"  // TODO: Add endpoints
  // | "mistral-large-2407"  // TODO: Add endpoints
  // | "pixtral-large-2411"  // TODO: Add endpoints
  // | "ministral-8b"  // TODO: Add endpoints
  // | "ministral-3b"  // TODO: Add endpoints
  // | "pixtral-12b"  // TODO: Add endpoints
  // | "mistral-nemo:free"  // TODO: Add endpoints
  // | "mistral-nemo"  // TODO: Add endpoints
  // | "mistral-7b-instruct-v0.3"  // TODO: Add endpoints
  // | "mistral-7b-instruct:free"  // TODO: Add endpoints
  // | "mistral-7b-instruct"  // TODO: Add endpoints
  // | "mixtral-8x22b-instruct"  // TODO: Add endpoints
  // | "mistral-large"  // TODO: Add endpoints
  // | "mistral-small"  // TODO: Add endpoints
  // | "mistral-tiny"  // TODO: Add endpoints
  // | "mistral-7b-instruct-v0.2"  // TODO: Add endpoints
  // | "mixtral-8x7b-instruct"  // TODO: Add endpoints
  // | "mistral-7b-instruct-v0.1"  // TODO: Add endpoints
  never;

export const mistralaiModels = {
  // TODO: Add models when endpoints are available
} satisfies Record<MistralModelName, Model>;

export default mistralaiModels;