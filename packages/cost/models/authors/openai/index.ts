/**
 * OpenAI author data aggregation
 */

import { type AuthorData } from '../../types';
import openaiModels, { type OpenAIModelName } from './models';
import openaiEndpoints from './endpoints';
import openaiMetadata from './metadata';

export const openai: AuthorData<OpenAIModelName> = {
  metadata: {
    ...openaiMetadata,
    modelCount: Object.keys(openaiModels).length,
  },
  models: openaiModels,
  endpoints: openaiEndpoints,
};

export type { OpenAIModelName };
export default openai;