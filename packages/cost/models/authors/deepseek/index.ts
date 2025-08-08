/**
 * Deepseek author data aggregation
 */

import { type AuthorData } from '../../types';
import deepseekModels, { type DeepSeekModelName } from './models';
import deepseekEndpoints from './endpoints';
import deepseekMetadata from './metadata';

export const deepseek: AuthorData<DeepSeekModelName> = {
  metadata: {
    ...deepseekMetadata,
    modelCount: Object.keys(deepseekModels).length,
  },
  models: deepseekModels,
  endpoints: deepseekEndpoints,
};

export type { DeepSeekModelName };
export default deepseek;