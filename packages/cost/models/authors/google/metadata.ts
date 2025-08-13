/**
 * Google provider metadata
 */

import type { AuthorMetadata } from "../../types";
import { googleModels } from "./index";

export const googleMetadata = {
  modelCount: Object.keys(googleModels).length,
  supported: true,
  name: "Google",
  slug: "google",
  description: "Google's Gemini models via Vertex AI",
  website: "https://cloud.google.com/vertex-ai",
  apiUrl: "https://{region}-aiplatform.googleapis.com/v1",
} satisfies AuthorMetadata;
