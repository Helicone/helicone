/**
 * Baidu metadata
 */

import type { AuthorMetadata } from "../../types";
import { baiduModels } from "./index";

export const baiduMetadata = {
  modelCount: Object.keys(baiduModels).length,
  supported: true,
} satisfies AuthorMetadata;
