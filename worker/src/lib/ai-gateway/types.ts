import { Endpoint, Plugin } from "@helicone-package/cost/models/types";
import { ProviderKey } from "../db/ProviderKeysStore";
import { ModelProviderName } from "@helicone-package/cost/models/providers";
import { Result } from "../util/results";

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

export type PendingEscrow = Promise<
  Result<
    {
      reservedEscrowId: string;
    },
    AttemptError
  >
>;

// For backwards compatibility
export interface EscrowInfo {
  escrow: PendingEscrow;
  endpoint: Endpoint;
}

// Error type matching the old aiGateway pattern
export type AttemptError = {
  type:
    | "invalid_format"
    | "missing_provider_key"
    | "request_failed"
    | "rate_limited"
    | "invalid_prompt"
    | "model_not_supported"
    | "insufficient_credit_limit"
    | "disallowed";
  message: string;
  statusCode: number;
  source?: string;
  details?: any;
};
