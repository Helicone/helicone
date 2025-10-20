import { Provider, SortOption } from "@/types/provider";

// Helicone org ID - only this org can see helicone provider
const HELICONE_ORG_ID = process.env.NEXT_PUBLIC_HELICONE_ORG_ID;

/**
 * Get provider name by ID
 */
export const getProviderNameById = (
  providerId: string,
  providers: Provider[],
): string => {
  const provider = providers.find((p) => p.id === providerId);
  return provider?.name || providerId;
};

/**
 * Filter providers by org - removes helicone provider for non-Helicone orgs
 */
export const filterProvidersByOrg = (
  providers: Provider[],
  orgId?: string,
): Provider[] => {
  return providers.filter((provider) => {
    // Only show helicone provider to Helicone org
    if (provider.id === "helicone") {
      return orgId === HELICONE_ORG_ID;
    }
    return true;
  });
};

/**
 * Filter providers based on search query
 */
export const filterProviders = (
  providers: Provider[],
  searchQuery: string,
): Provider[] => {
  return providers.filter(
    (provider) =>
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );
};

/**
 * Sort providers based on selected option
 */
export const sortProviders = (
  providers: Provider[],
  sortOption: SortOption,
  recentlyUsedProviderIds: string[],
): Provider[] => {
  if (sortOption === "relevance") {
    return [...providers].sort((a, b) => b.relevanceScore - a.relevanceScore);
  } else if (sortOption === "alphabetical") {
    return [...providers].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortOption === "recently-used") {
    return [...providers].sort((a, b) => {
      const aIndex = recentlyUsedProviderIds.indexOf(a.id);
      const bIndex = recentlyUsedProviderIds.indexOf(b.id);

      if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }

  return providers;
};
