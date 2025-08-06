/**
 * Xai author data aggregation
 */

import { type AuthorData } from '../../types';
import xAiModels, { type XAIModelName } from './models';
import xAiEndpoints from './endpoints';
import xAiMetadata from './metadata';

export const xAi: AuthorData = {
  metadata: {
    ...xAiMetadata,
    modelCount: Object.keys(xAiModels).length,
  },
  models: xAiModels,
  endpoints: xAiEndpoints,
};

export type { XAIModelName };
export default xAi;