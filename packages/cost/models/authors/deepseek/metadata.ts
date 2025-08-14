/**
 * DeepSeek metadata
 */

import type { AuthorMetadata } from "../../types";

export const deepseekMetadata = {
  supported: true,
  name: "DeepSeek",
  slug: "deepseek",
  description:
    "Cost-effective frontier AI models with advanced reasoning capabilities",
  website: "https://www.deepseek.com",
  apiUrl: "https://api.deepseek.com/v1",
} satisfies AuthorMetadata;
