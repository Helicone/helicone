import type { ModelConfig, ModelProviderConfig } from "../../types";
import { endpoints as ornith15Endpoints } from "./ornith-1.5/endpoints";
import { models as ornith15Models } from "./ornith-1.5/models";

export const ornithAiModels = {
  ...ornith15Models,
} satisfies Record<string, ModelConfig>;

export const ornithAiEndpointConfig = {
  ...ornith15Endpoints,
} satisfies Record<string, ModelProviderConfig>;
