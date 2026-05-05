/**
 * Models and endpoints served via HPC-AI inference (kept separate from per-vendor author trees).
 */

import type { ModelConfig, ModelProviderConfig } from "../../types";

import { models as minimaxM25Models } from "./minimax-m2.5/models";
import { endpoints as minimaxM25Endpoints } from "./minimax-m2.5/endpoints";

export const hpcaiHostedModels = {
  ...minimaxM25Models,
} satisfies Record<string, ModelConfig>;

export const hpcaiHostedEndpointConfig = {
  ...minimaxM25Endpoints,
} satisfies Record<string, ModelProviderConfig>;
