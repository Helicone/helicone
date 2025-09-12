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

  // Mutation to create/update provider key
  const updateProviderKey = useMutation({
    mutationFn: async ({
      key,
      secretKey,
      keyId,
      config,
      byokEnabled,
    }: {
      key?: string;
      secretKey?: string;
      keyId: string;
      config?: Record<string, any>;
      byokEnabled: boolean;
    }) => {
      if (!orgId) throw new Error("No organization selected");

      const jawnClient = getJawnClient(orgId);

      // Build body object conditionally - only include defined values
      const body: any = {};
      if (key !== undefined) body.providerKey = key;
      if (secretKey !== undefined) body.providerSecretKey = secretKey;
      if (config !== undefined) body.config = config;
      if (byokEnabled !== undefined) body.byokEnabled = byokEnabled;

      // Debug log to see what we're sending
      console.log("Updating provider key with body:", body);
      console.log("Raw params:", { key, secretKey, config, byokEnabled });

      return jawnClient.PATCH("/v1/api-keys/provider-key/{providerKeyId}", {
        params: {
          path: {
            providerKeyId: keyId,
          },
        },
        body,
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
      byokEnabled,
    }: {
      providerName: string;
      key: string;
      secretKey?: string;
      providerKeyName: string;
      config?: Record<string, any>;
      byokEnabled: boolean;
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
            byokEnabled,
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

  const deleteProviderKey = useMutation({
    mutationFn: async (keyId: string) => {
      if (!orgId) throw new Error("No organization selected");

      const jawnClient = getJawnClient(orgId);

      const response = await jawnClient.DELETE(
        "/v1/api-keys/provider-key/{providerKeyId}",
        {
          params: {
            path: {
              providerKeyId: keyId,
            },
          },
        },
      );

      if (response && "error" in response) {
        throw new Error(response.error);
      }

      return response.data;
    },
    onSuccess: () => {
      setNotification("Provider key deleted successfully", "success");
      queryClient.invalidateQueries({ queryKey: providerKeysQueryKey });
    },
    onError: (error: Error) => {
      logger.error({ error }, "Failed to delete provider key");
      setNotification(
        "Failed to delete key: " + (error.message || "Unknown error"),
        "error",
      );
    },
  });

  const providerKeys = providerKeysData || [];
  const existingKey = providerId
    ? providerKeys.find(
        (key: any) => key.provider_name === providerId && !key.soft_delete,
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
    deleteProviderKey,
    isSavingKey: updateProviderKey.isPending || addProviderKey.isPending,
    isSavedKey: updateProviderKey.isSuccess || addProviderKey.isSuccess,
    isDeletingKey: deleteProviderKey.isPending,
    viewDecryptedProviderKey,
    refetchProviderKeys,
  };
};
