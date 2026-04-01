import type { ModelConfig, ModelProviderConfig } from "../../types";

import { models as minimaxM25Models } from "./minimax-m2.5/models";
import { endpoints as minimaxM25Endpoints } from "./minimax-m2.5/endpoints";

export const minimaxModels = {
  ...minimaxM25Models,
} satisfies Record<string, ModelConfig>;

export const minimaxEndpointConfig = {
  ...minimaxM25Endpoints,
} satisfies Record<string, ModelProviderConfig>;
