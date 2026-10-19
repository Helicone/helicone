import { useOrg } from "@/components/layout/org/organizationContext";
import useNotification from "@/components/shared/notification/useNotification";
import { getJawnClient } from "@/lib/clients/jawn";
import { Provider, ProviderKey } from "@/types/provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { logger } from "@/lib/telemetry/logger";

/**
 * Pull a human-readable message out of an openapi-fetch error payload. Jawn
 * returns either `{ error: string }` or a `Result` (`{ data, error }`).
 */
const jawnErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "error" in error) {
    const inner = (error as { error: unknown }).error;
    if (typeof inner === "string") return inner;
  }
  return "Unknown error";
};

/**
 * openapi-fetch returns `{ error }` for non-2xx responses, but the generated
 * Jawn types declare no error responses, so `error` is typed as `never`.
 */
const responseError = (response: unknown): unknown =>
  response && typeof response === "object" && "error" in response
    ? (response as { error?: unknown }).error
    : undefined;

export type MaskedProviderKeyResult =
  | {
      ok: true;
      providerKeyMasked: string | null;
      providerSecretKeyMasked: string | null;
    }
  | { ok: false; forbidden: boolean; message: string };

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

      const response = await jawnClient.PATCH(
        "/v1/api-keys/provider-key/{providerKeyId}",
        {
          params: {
            path: {
              providerKeyId: keyId,
            },
          },
          body,
        },
      );

      if (responseError(response)) {
        throw new Error(jawnErrorMessage(responseError(response)));
      }
      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
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

        if (responseError(response)) {
          throw new Error(jawnErrorMessage(responseError(response)));
        }
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

  /**
   * Fetch the MASKED form of a stored provider key (e.g. "sk-ant••••••••abcd").
   * Plaintext provider keys are never returned to the browser (INC-710), and
   * only organization owners/admins may call this.
   */
  const viewMaskedProviderKey = async (
    keyId: string,
  ): Promise<MaskedProviderKeyResult> => {
    if (!orgId) {
      return { ok: false, forbidden: false, message: "No organization" };
    }

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

      const error = responseError(response);
      if (error) {
        logger.error(
          { error, keyId, orgId },
          "Failed to fetch masked provider key",
        );
        return {
          ok: false,
          forbidden: response.response?.status === 403,
          message: jawnErrorMessage(error),
        };
      }

      const data = response.data;
      if (data && typeof data === "object" && "provider_key_masked" in data) {
        return {
          ok: true,
          providerKeyMasked: data.provider_key_masked ?? null,
          providerSecretKeyMasked: data.provider_secret_key_masked ?? null,
        };
      }

      return {
        ok: false,
        forbidden: false,
        message:
          data && typeof data === "object" && "error" in data
            ? jawnErrorMessage(data)
            : "Unexpected response",
      };
    } catch (error) {
      logger.error({ error, keyId, orgId }, "Error viewing masked key");
      return { ok: false, forbidden: false, message: "Unexpected error" };
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

      if (responseError(response)) {
        throw new Error(jawnErrorMessage(responseError(response)));
      }
      if (response.data && "error" in response.data) {
        throw new Error(jawnErrorMessage(response.data));
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
    viewMaskedProviderKey,
    refetchProviderKeys,
  };
};
