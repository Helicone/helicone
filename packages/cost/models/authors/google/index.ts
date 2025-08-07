/**
 * Google author data aggregation
 */

import { type AuthorData } from '../../types';
import googleModels, { type GoogleModelName } from './models';
import googleEndpoints from './endpoints';
import googleMetadata from './metadata';

export const google: AuthorData = {
  metadata: {
    ...googleMetadata,
    modelCount: Object.keys(googleModels).length,
  },
  models: googleModels,
  endpoints: googleEndpoints,
};

export type { GoogleModelName };
export default google;