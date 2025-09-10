/**
 * Alibaba metadata
 */

import type { AuthorMetadata } from "../../types";
import { alibabaModels } from "./index";

export const alibabaMetadata = {
  modelCount: Object.keys(alibabaModels).length,
  supported: true,
} satisfies AuthorMetadata;
