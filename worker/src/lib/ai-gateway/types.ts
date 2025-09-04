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

export interface EscrowReservation {
  escrowId: string;
  endpoint: Endpoint;
  amount: number;
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
