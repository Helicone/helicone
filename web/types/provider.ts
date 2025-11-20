import { ModelProviderName } from "../../packages/cost/models/providers";

export interface Provider {
  id: ModelProviderName;
  name: string;
  logoUrl: string;
  description: string;
  docsUrl: string;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  relevanceScore: number; // Hidden score for sorting by relevance
  note?: string;
  multipleAllowed?: boolean;
  auth?: "api-key" | "oauth" | "aws-signature" | "service_account";
  publiclyVisible?: boolean;
}

// Interface for provider configuration from API
export interface ProviderConfiguration {
  id: string;
  provider_name: string;
  provider_configuration: Record<string, any>;
  created_at: string;
  updated_at: string;
  provider_keys?: ProviderKey[]; // Associated provider keys
}

// Interface for provider keys
export interface ProviderKey {
  id: string;
  provider_name: ModelProviderName;
  provider_key_name: string;
  created_at?: string;
  soft_delete: boolean;
  config?: Record<string, any>; // JSON config field for provider-specific settings
  cuid?: string | null; // CUID for the provider key
  byok_enabled?: boolean; // Indicates if key is enabled for AI Gateway (BYOK)
}

// Interface for decrypted provider key
export interface DecryptedProviderKey {
  id: string | null;
  org_id: string | null;
  provider_key: string | null;
  provider_name: string | null;
  provider_key_name: string | null;
}

export type SortOption = "relevance" | "alphabetical" | "recently-used";
