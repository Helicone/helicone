/**
 * Google metadata
 */

import { AuthorMetadata } from "../../types";
import { googleModels } from ".";

export const googleMetadata = {
  modelCount: Object.keys(googleModels).length,
  supported: true,
} satisfies AuthorMetadata;
