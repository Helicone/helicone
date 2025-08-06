/**
 * Moonshotai author data aggregation
 */

import { type AuthorData } from '../../types';
import moonshotaiModels, { type MoonshotModelName } from './models';
import moonshotaiEndpoints from './endpoints';
import moonshotaiMetadata from './metadata';

export const moonshotai: AuthorData<MoonshotModelName> = {
  metadata: {
    ...moonshotaiMetadata,
    modelCount: Object.keys(moonshotaiModels).length,
  },
  models: moonshotaiModels,
  endpoints: moonshotaiEndpoints,
};

export type { MoonshotModelName };
export default moonshotai;