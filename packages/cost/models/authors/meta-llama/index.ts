/**
 * Metallama author data aggregation
 */

import { type AuthorData } from '../../types';
import metaLlamaModels, { type MetaLlamaModelName } from './models';
import metaLlamaEndpoints from './endpoints';
import metaLlamaMetadata from './metadata';

export const metaLlama: AuthorData = {
  metadata: {
    ...metaLlamaMetadata,
    modelCount: Object.keys(metaLlamaModels).length,
  },
  models: metaLlamaModels,
  endpoints: metaLlamaEndpoints,
};

export type { MetaLlamaModelName };
export default metaLlama;