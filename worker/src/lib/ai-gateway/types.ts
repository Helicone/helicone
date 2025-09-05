import { Endpoint } from "@helicone-package/cost/models/types";
import { ProviderKey } from "../db/ProviderKeysStore";
import { ModelProviderName } from "@helicone-package/cost/models/providers";

export interface Attempt {
  endpoint: Endpoint;
  providerKey: ProviderKey;
  authType: "byok" | "ptb";
  priority: number;
  needsEscrow: boolean;
  source: string;
}

export interface ModelSpec {
  modelName: string;
  provider?: ModelProviderName;
  customUid?: string;
}

export interface DisallowListEntry {
  provider: string;
  model: string;
}

// For backwards compatibility
export interface EscrowInfo {
  escrowId: string;
  endpoint: Endpoint;
  model: string;
}

// Error type matching the old aiGateway pattern
export type AttemptError = {
  type:
    | "invalid_format"
    | "missing_provider_key"
    | "request_failed"
    | "invalid_prompt"
    | "model_not_supported";
  message: string;
  statusCode: number;
  details?: string;
};
