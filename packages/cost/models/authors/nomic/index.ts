import type { ModelConfig, ModelProviderConfig } from "../../types";
import { models as nomicEmbedModels } from "./nomic-embed-text/models";
import { endpoints as nomicEmbedEndpoints } from "./nomic-embed-text/endpoints";

export const nomicModels = {
  ...nomicEmbedModels,
} satisfies Record<string, ModelConfig>;

export const nomicEndpointConfig = {
  ...nomicEmbedEndpoints,
} satisfies Record<string, ModelProviderConfig>;
