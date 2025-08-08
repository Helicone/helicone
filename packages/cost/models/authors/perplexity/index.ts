/**
 * Perplexity author data aggregation
 */

import { type AuthorData } from '../../types';
import perplexityModels, { type PerplexityModelName } from './models';
import perplexityEndpoints from './endpoints';
import perplexityMetadata from './metadata';

export const perplexity: AuthorData<PerplexityModelName> = {
  metadata: {
    ...perplexityMetadata,
    modelCount: Object.keys(perplexityModels).length,
  },
  models: perplexityModels,
  endpoints: perplexityEndpoints,
};

export type { PerplexityModelName };
export default perplexity;