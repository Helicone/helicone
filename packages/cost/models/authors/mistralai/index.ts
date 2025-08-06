/**
 * Mistralai author data aggregation
 */

import { type AuthorData } from '../../types';
import mistralaiModels, { type MistralModelName } from './models';
import mistralaiEndpoints from './endpoints';
import mistralaiMetadata from './metadata';

export const mistralai: AuthorData = {
  metadata: {
    ...mistralaiMetadata,
    modelCount: Object.keys(mistralaiModels).length,
  },
  models: mistralaiModels,
  endpoints: mistralaiEndpoints,
};

export type { MistralModelName };
export default mistralai;