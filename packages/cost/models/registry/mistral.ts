/**
 * Mistral model definitions
 * Contains all models created by Mistral
 * Auto-generated on: 2025-08-04T02:18:27.177Z
 * Total models: 1
 */

import type { BaseModel } from "../types";

export const mistralModels = {
  "mixtral-8x7b-32768": {
  id: "mixtral-8x7b-32768",
  creator: "Mistral",
  metadata: {
    displayName: "Mixtral 8x7B",
    description: "Mistral's Mixtral 8x7B model",
    contextWindow: 32768,
    releaseDate: "2023-12-11"
  },
  providers: {
    "groq": {
      provider: "groq",
      available: true,
      cost: {
        prompt_token: 0.00027,
        completion_token: 0.00027
      }
    }
  },
  slug: "mixtral-8x7b"
},
} satisfies Record<string, BaseModel>;
