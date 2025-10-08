import { Endpoint, Plugin } from "@helicone-package/cost/models/types";
import { ProviderKey } from "../db/ProviderKeysStore";
import { ModelProviderName } from "@helicone-package/cost/models/providers";

export interface Attempt {
  endpoint: Endpoint;
  providerKey: ProviderKey;
  authType: "byok" | "ptb";
  priority: number;
  source: string;
  plugins?: Plugin[];
}

export interface DisallowListEntry {
  provider: string;
  model: string;
}

// For backwards compatibility
export interface EscrowInfo {
  escrowId: string;
  endpoint: Endpoint;
}

// Error type matching the old aiGateway pattern
export type AttemptError = {
  type:
    | "invalid_format"
    | "missing_provider_key"
    | "request_failed"
    | "invalid_prompt"
    | "model_not_supported"
    | "insufficient_credit_limit"
    | "disallowed";
  message: string;
  statusCode: number;
  source?: string;
  details?: string;
};
