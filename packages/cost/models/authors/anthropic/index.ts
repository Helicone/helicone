/**
 * Anthropic author data aggregation
 */

import { type AuthorData } from '../../types';
import anthropicModels, { type AnthropicModelName } from './models';
import anthropicEndpoints from './endpoints';
import anthropicMetadata from './metadata';

export const anthropic: AuthorData = {
  metadata: {
    ...anthropicMetadata,
    modelCount: Object.keys(anthropicModels).length,
  },
  models: anthropicModels,
  endpoints: anthropicEndpoints,
};

export type { AnthropicModelName };
export default anthropic;