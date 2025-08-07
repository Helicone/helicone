/**
 * Nvidia author data aggregation
 */

import { type AuthorData } from '../../types';
import nvidiaModels, { type NvidiaModelName } from './models';
import nvidiaEndpoints from './endpoints';
import nvidiaMetadata from './metadata';

export const nvidia: AuthorData = {
  metadata: {
    ...nvidiaMetadata,
    modelCount: Object.keys(nvidiaModels).length,
  },
  models: nvidiaModels,
  endpoints: nvidiaEndpoints,
};

export type { NvidiaModelName };
export default nvidia;