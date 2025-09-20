import { providers, ModelProviderName } from "@helicone-package/cost/models/providers";

export interface ProviderInfo {
  id: ModelProviderName;
  name: string;
  auth: "api-key" | "oauth" | "aws-signature" | "service_account";
  logoUrl: string;
  description: string;
  docsUrl?: string;
  relevanceScore: number;
  multipleAllowed: boolean;
  requiredConfig: readonly string[];
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
}

/**
 * Get all providers with their UI metadata
 * Falls back to defaults if a provider doesn't have UI config
 */
export function getAllProviders(): ProviderInfo[] {
  return Object.entries(providers).map(([id, provider]) => {
    const uiConfig = provider.uiConfig;

    // Map auth type to user-friendly label and placeholder
    const authLabels = {
      "api-key": { label: "API Key", placeholder: "Enter API key..." },
      "service_account": { label: "Service Account", placeholder: "Upload service account JSON..." },
      "aws-signature": { label: "AWS Credentials", placeholder: "Enter credentials..." },
      "oauth": { label: "OAuth Token", placeholder: "Enter OAuth token..." },
    };

    const authInfo = authLabels[provider.auth] || authLabels["api-key"];

    return {
      id: id as ModelProviderName,
      name: provider.displayName,
      auth: provider.auth,
      logoUrl: uiConfig?.logoUrl || `/assets/providers/default.png`,
      description: uiConfig?.description || `Configure ${provider.displayName} API credentials`,
      docsUrl: uiConfig?.docsUrl,
      relevanceScore: uiConfig?.relevanceScore || 50,
      multipleAllowed: uiConfig?.multipleAllowed || false,
      requiredConfig: provider.requiredConfig || [],
      apiKeyLabel: authInfo.label,
      apiKeyPlaceholder: authInfo.placeholder,
    };
  });
}

/**
 * Sort providers by relevance and filter by search query
 */
export function filterAndSortProviders(
  providers: ProviderInfo[],
  searchQuery: string = "",
  sortOption: "relevance" | "alphabetical" | "recently-used" = "relevance",
  recentlyUsedIds: string[] = []
): ProviderInfo[] {
  // Filter by search query
  const filtered = searchQuery
    ? providers.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : providers;

  // Sort based on option
  return filtered.sort((a, b) => {
    switch (sortOption) {
      case "alphabetical":
        return a.name.localeCompare(b.name);
      case "recently-used":
        const aIndex = recentlyUsedIds.indexOf(a.id);
        const bIndex = recentlyUsedIds.indexOf(b.id);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return b.relevanceScore - a.relevanceScore;
      case "relevance":
      default:
        return b.relevanceScore - a.relevanceScore;
    }
  });
}