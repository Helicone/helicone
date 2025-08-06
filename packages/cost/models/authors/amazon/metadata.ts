/**
 * Amazon metadata
 */

import { type AuthorMetadata } from '../../types';

export const amazonMetadata: AuthorMetadata = {
  modelCount: 3,
  supported: true,
  baseUrl: "https://bedrock-runtime.{{region}}.amazonaws.com",
};

export default amazonMetadata;