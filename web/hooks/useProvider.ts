import { useOrg } from "@/components/layout/org/organizationContext";
import useNotification from "@/components/shared/notification/useNotification";
import { getJawnClient } from "@/lib/clients/jawn";
import { Provider, ProviderKey } from "@/types/provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { logger } from "@/lib/telemetry/logger";

interface UseProviderParams {
  // If a provider is specified, the hook will work in "provider-specific" mode
  provider?: Provider;
}

/**
 * Unified hook for managing provider keys
 */
export const useProvider = ({ provider }: UseProviderParams = {}) => {
  const org = useOrg();
  const { setNotification } = useNotification();
  const queryClient = useQueryClient();
  const orgId = org?.currentOrg?.id;
  const providerId = provider?.id;
  const providerName = provider?.name;

  // Query keys for cache management
  const providerKeysQueryKey = ["provider-keys", orgId];

  // Query to fetch provider keys
  const { data: providerKeysData, refetch: refetchProviderKeys } = useQuery({
    queryKey: providerKeysQueryKey,
    queryFn: async () => {
      if (!orgId) return [] as ProviderKey[];

      const jawnClient = getJawnClient(orgId);
      const response = await jawnClient.GET("/v1/api-keys/provider-keys", {});

      if (response && "error" in response) {
        logger.error(
          { error: response.error, orgId },
          "Failed to fetch provider keys",
        );
        return [] as ProviderKey[];
      }

      return (response?.data || []) as ProviderKey[];
    },
    enabled: !!orgId,
  });

  // Get provider-specific data

  // Mutation to create/update provider key
  const updateProviderKey = useMutation({
    mutationFn: async ({
      providerName,
      key,
      secretKey,
      keyId,
      providerKeyName,
      config,
    }: {
      providerName: string;
      key?: string;
      secretKey?: string;
      keyId: string;
      providerKeyName: string;
      config?: Record<string, any>;
    }) => {
      if (!orgId) throw new Error("No organization selected");

      const jawnClient = getJawnClient(orgId);

      return jawnClient.PATCH("/v1/api-keys/provider-key/{providerKeyId}", {
        params: {
          path: {
            providerKeyId: keyId,
          },
        },
        body: {
          providerKey: key,
          providerSecretKey: secretKey,
          config,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providerKeysQueryKey });
    },
    onError: (error: Error) => {
      setNotification(
        "Failed to save key: " + (error.message || "Unknown error"),
        "error",
      );
    },
  });

  const addProviderKey = useMutation({
    mutationFn: async ({
      providerName,
      key,
      secretKey,
      providerKeyName,
      config,
    }: {
      providerName: string;
      key: string;
      secretKey?: string;
      providerKeyName: string;
      config?: Record<string, any>;
    }) => {
      if (!orgId) throw new Error("No organization selected");
      const jawnClient = getJawnClient(orgId);

      try {
        const response = await jawnClient.POST("/v1/api-keys/provider-key", {
          body: {
            providerName,
            providerKey: key,
            providerSecretKey: secretKey,
            providerKeyName,
            config: config || {},
          },
        });

        if (response.error) throw new Error(response);
        return response.data;
      } catch (error) {
        logger.error(
          { error, providerName, providerKeyName, orgId },
          "Error adding provider key",
        );
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providerKeysQueryKey });
    },
    onError: (error: Error) => {
      setNotification(
        "Failed to add key: " + (error.message || "Unknown error"),
        "error",
      );
    },
  });

  const viewDecryptedProviderKey = async (
    keyId: string,
  ): Promise<{
    providerKey: string;
    providerSecretKey?: string | null;
  } | null> => {
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
        },
      );

      if (response && "error" in response) {
        logger.error(
          { error: response.error, keyId, orgId },
          "Failed to fetch decrypted key",
        );
        return null;
      }

      // Type guard to safely access provider_key
      if (
        response?.data &&
        typeof response.data === "object" &&
        "provider_key" in response.data
      ) {
        return {
          providerKey: response.data.provider_key || "",
          providerSecretKey:
            "provider_secret_key" in response.data
              ? response.data.provider_secret_key
              : "",
        };
      }

      return null;
    } catch (error) {
      logger.error({ error, keyId, orgId }, "Error viewing decrypted key");
      return null;
    }
  };

  const providerKeys = providerKeysData || [];
  const existingKey = providerId
    ? providerKeys.find(
        (key: any) => key.provider_name === providerName && !key.soft_delete,
      )
    : undefined;

  // Return the combined interface with all needed functionality
  return {
    // Data
    providerKeys: providerKeys as ProviderKey[],
    isLoadingKeys: false,
    existingKey,
    addProviderKey,
    updateProviderKey,
    isSavingKey: updateProviderKey.isPending || addProviderKey.isPending,
    isSavedKey: updateProviderKey.isSuccess || addProviderKey.isSuccess,
    viewDecryptedProviderKey,
    refetchProviderKeys,
  };
};
