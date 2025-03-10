import { useState } from "react";
import { useOrg } from "@/components/layout/org/organizationContext";
import useNotification from "@/components/shared/notification/useNotification";
import { getJawnClient } from "@/lib/clients/jawn";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Provider, ProviderKey } from "@/types/provider";

interface UseProviderParams {
  // If a provider is specified, the hook will work in "provider-specific" mode
  provider?: Provider;
}

interface UseProviderReturn {
  // Data
  providerKeys?: ProviderKey[];
  isLoadingKeys?: boolean;
  existingKey?: ProviderKey;

  // State
  apiKey: string;
  isSavingKey: boolean;
  isSavedKey: boolean;

  // Methods
  setApiKey: (value: string) => void;
  refetchProviderKeys: () => Promise<unknown>;
  viewDecryptedProviderKey?: (keyId: string) => Promise<string | null>;

  // Provider-specific actions
  handleSaveKey?: () => Promise<void>;
}

/**
 * Unified hook for managing provider keys
 */
export const useProvider = ({
  provider,
}: UseProviderParams = {}): UseProviderReturn => {
  const org = useOrg();
  const { setNotification } = useNotification();
  const queryClient = useQueryClient();
  const orgId = org?.currentOrg?.id;
  const providerId = provider?.id;
  const providerName = provider?.name;

  // Local state for form
  const [apiKey, setApiKey] = useState("");
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [savedProvider, setSavedProvider] = useState<string | null>(null);

  // Query keys for cache management
  const providerKeysQueryKey = ["provider-keys", orgId];

  // Query to fetch provider keys
  const { data: providerKeysData, refetch: refetchProviderKeysQuery } =
    useQuery({
      queryKey: providerKeysQueryKey,
      queryFn: async () => {
        if (!orgId) return [] as ProviderKey[];

        const jawnClient = getJawnClient(orgId);
        const response = await jawnClient.GET("/v1/api-keys/provider-keys", {});

        if (response && "error" in response) {
          console.error("Failed to fetch provider keys:", response.error);
          return [] as ProviderKey[];
        }

        return (response?.data || []) as ProviderKey[];
      },
      enabled: !!orgId,
    });

  // Get provider-specific data
  const providerKeys = providerKeysData || [];
  const existingKey = providerId
    ? providerKeys.find(
        (key) => key.provider_id === providerId && !key.soft_delete
      )
    : undefined;
  const isSavingKey = providerId ? savingProvider === providerId : false;
  const isSavedKey = providerId ? savedProvider === providerId : false;

  // Mutation to create/update provider key
  const upsertProviderKey = useMutation({
    mutationFn: async ({
      providerId,
      providerName,
      key,
      keyId,
    }: {
      providerId: string;
      providerName: string;
      key?: string;
      keyId?: string;
    }) => {
      if (!orgId) throw new Error("No organization selected");

      const jawnClient = getJawnClient(orgId);

      if (keyId) {
        // Update existing key - only send key if it's provided
        return jawnClient.PATCH("/v1/api-keys/provider-key/{providerKeyId}", {
          params: {
            path: {
              providerKeyId: keyId,
            },
          },
          body: {
            providerKey: key,
          },
        });
      } else {
        // Create new key
        if (!key) throw new Error("API key is required");

        // Make POST request for new key
        return jawnClient.POST("/v1/api-keys/provider-key", {
          body: {
            providerName,
            providerKey: key,
            providerId,
          },
        });
      }
    },
    onSuccess: () => {
      setApiKey("");

      // Invalidate both the provider keys list and any specific decrypted key queries
      queryClient.invalidateQueries({ queryKey: providerKeysQueryKey });

      // Set saved state for UI feedback
      setSavedProvider(providerId || null);
      setTimeout(() => {
        setSavedProvider(null);
      }, 3000);
    },
    onError: (error: Error) => {
      setNotification(
        "Failed to save key: " + (error.message || "Unknown error"),
        "error"
      );
    },
    onSettled: () => {
      setSavingProvider(null);
    },
  });

  // Provider-specific save action
  const handleSaveKey = async () => {
    if (!providerId || !providerName) return;

    setSavingProvider(providerId);
    await upsertProviderKey.mutateAsync({
      providerId,
      providerName,
      key: apiKey || undefined,
      keyId: existingKey?.id,
    });
  };

  const refetchProviderKeys = async () => {
    return refetchProviderKeysQuery();
  };

  const viewDecryptedProviderKey = async (
    keyId: string
  ): Promise<string | null> => {
    if (!orgId) return null;

    try {
      const jawnClient = getJawnClient(orgId);
      const response = await jawnClient.GET(
        `/v1/api-keys/provider-key/{providerKeyId}`,
        {
          params: {
            path: {
              providerKeyId: keyId,
            },
          },
        }
      );

      if (response && "error" in response) {
        console.error("Failed to fetch decrypted key:", response.error);
        return null;
      }

      // Type guard to safely access provider_key
      if (
        response?.data &&
        typeof response.data === "object" &&
        "provider_key" in response.data
      ) {
        return response.data.provider_key || null;
      }

      return null;
    } catch (error) {
      console.error("Error viewing decrypted key:", error);
      return null;
    }
  };

  // Return the combined interface with all needed functionality
  return {
    // Data
    providerKeys: providerKeys as ProviderKey[],
    isLoadingKeys: false,
    existingKey,

    // State
    apiKey,
    isSavingKey,
    isSavedKey,

    // Methods
    setApiKey,
    refetchProviderKeys,
    viewDecryptedProviderKey: existingKey
      ? viewDecryptedProviderKey
      : undefined,

    // Provider-specific actions
    handleSaveKey: providerId && providerName ? handleSaveKey : undefined,
  };
};
