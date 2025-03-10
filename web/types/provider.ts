export interface Provider {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  docsUrl: string;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  relevanceScore: number; // Hidden score for sorting by relevance
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
  provider_name: string;
  provider_key_name: string;
  created_at?: string;
  soft_delete: boolean;
  config?: Record<string, any>; // JSON config field for provider-specific settings
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
