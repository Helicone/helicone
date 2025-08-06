/**
 * Cohere author data aggregation
 */

import { type AuthorData } from '../../types';
import cohereModels, { type CohereModelName } from './models';
import cohereEndpoints from './endpoints';
import cohereMetadata from './metadata';

export const cohere: AuthorData = {
  metadata: {
    ...cohereMetadata,
    modelCount: Object.keys(cohereModels).length,
  },
  models: cohereModels,
  endpoints: cohereEndpoints,
};

export type { CohereModelName };
export default cohere;