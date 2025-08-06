/**
 * Amazon author data aggregation
 */

import { type AuthorData } from '../../types';
import amazonModels, { type AmazonModelName } from './models';
import amazonEndpoints from './endpoints';
import amazonMetadata from './metadata';

export const amazon: AuthorData = {
  metadata: {
    ...amazonMetadata,
    modelCount: Object.keys(amazonModels).length,
  },
  models: amazonModels,
  endpoints: amazonEndpoints,
};

export type { AmazonModelName };
export default amazon;