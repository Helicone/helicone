import type { ModelConfig, ModelProviderConfig } from "../../types";
import { models as tinyChatModels } from "./tiny-chat/models";
import { endpoints as tinyChatEndpoints } from "./tiny-chat/endpoints";

export const neuronpoolModels = {
  ...tinyChatModels,
} satisfies Record<string, ModelConfig>;

export const neuronpoolEndpointConfig = {
  ...tinyChatEndpoints,
} satisfies Record<string, ModelProviderConfig>;
