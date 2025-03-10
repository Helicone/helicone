import { useOrg } from "@/components/layout/org/organizationContext";
import useNotification from "@/components/shared/notification/useNotification";
import { getJawnClient } from "@/lib/clients/jawn";
import { Provider, ProviderConfiguration, ProviderKey } from "@/types/provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

// Hook for managing provider configurations
export const useProviderConfig = () => {
  const org = useOrg();
  const orgId = org?.currentOrg?.id;
  const queryClient = useQueryClient();
  const { setNotification } = useNotification();

  // State for API keys and key names
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [keyNames, setKeyNames] = useState<Record<string, string>>({});
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [savedProvider, setSavedProvider] = useState<string | null>(null);

  // Query to fetch provider configurations
  const { data: providerConfigs, isLoading: isLoadingConfigs } = useQuery({
    queryKey: ["providerConfigs"],
    queryFn: async () => {
      if (!orgId) return { data: [] };

      try {
        const jawnClient = getJawnClient(orgId);
        const response: any = await jawnClient.GET("/v1/provider-config", {});

        if (response?.error) {
          console.error(
            "Failed to fetch provider configurations:",
            response.error
          );
          return { data: [] };
        }

        return {
          data: (response?.data?.data || []) as ProviderConfiguration[],
        };
      } catch (error) {
        console.error("Error fetching provider configurations:", error);
        return { data: [] };
      }
    },
    enabled: !!orgId,
  });

  const upsertProviderConfig = useMutation({
    mutationFn: async ({
      providerName,
      configuration,
    }: {
      providerName: string;
      configuration: Record<string, any>;
    }) => {
      if (!orgId) {
        throw new Error("No organization selected");
      }

      const jawnClient = getJawnClient(orgId);
      const response = await jawnClient.POST("/v1/provider-config", {
        body: {
          provider_name: providerName,
          provider_configuration: configuration,
        },
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providerConfigs"] });
    },
    onError: (error) => {
      console.error("Failed to save provider configuration:", error);
      setNotification(
        "Failed to save provider configuration. Please try again.",
        "error"
      );
    },
  });

  // Add a provider key
  const addProviderKey = useMutation({
    mutationFn: async ({
      providerName,
      keyName,
      key,
      configurationId,
    }: {
      providerName: string;
      keyName: string;
      key: string;
      configurationId?: string;
    }) => {
      if (!orgId) {
        throw new Error("No organization selected");
      }

      const jawnClient = getJawnClient(orgId);
      const response = await jawnClient.POST("/v1/api-keys/provider-key", {
        body: {
          providerName,
          providerKeyName: keyName,
          providerKey: key,
          providerConfigurationId: configurationId,
        },
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providerConfigs"] });
    },
    onError: (error) => {
      console.error("Failed to save provider key:", error);
      setNotification(
        "Failed to save provider key. Please try again.",
        "error"
      );
    },
  });

  // Delete a provider key
  const deleteProviderKey = useMutation({
    mutationFn: async (keyId: string) => {
      if (!orgId) {
        throw new Error("No organization selected");
      }

      const jawnClient = getJawnClient(orgId);
      const response = await jawnClient.DELETE(
        "/v1/api-keys/provider-key/{providerKeyId}",
        {
          params: {
            path: {
              providerKeyId: keyId,
            },
          },
        }
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providerConfigs"] });
    },
    onError: (error) => {
      console.error("Failed to delete provider key:", error);
      setNotification(
        "Failed to delete provider key. Please try again.",
        "error"
      );
    },
  });

  // Helper to get provider keys for a configuration
  const getProviderKeysForProvider = (providerId: string): ProviderKey[] => {
    if (!providerConfigs?.data) return [];

    // Find the configuration for this provider
    const config = providerConfigs.data.find(
      (config) => config.provider_name === providerId
    );

    // Return the keys if they exist, otherwise empty array
    return config?.provider_keys || [];
  };

  // Helper function to get configuration ID for a provider
  const getConfigurationIdForProvider = (
    providerId: string
  ): string | undefined => {
    if (!providerConfigs?.data) return undefined;
    const config = providerConfigs.data.find(
      (config) => config.provider_name === providerId
    );
    return config?.id;
  };

  // Function to save provider configuration
  const saveConfig = async (
    providerId: string,
    providers: Provider[]
  ): Promise<string | undefined> => {
    try {
      // Create a configuration object with settings
      const configuration = {};

      // Call the mutation to save the provider configuration
      const result = await upsertProviderConfig.mutateAsync({
        providerName: providerId,
        configuration,
      });

      // Explicitly force a refetch to update the UI immediately
      await queryClient.invalidateQueries({ queryKey: ["providerConfigs"] });
      await queryClient.refetchQueries({ queryKey: ["providerConfigs"] });

      // Find provider name for notification
      const provider = providers.find((p) => p.id === providerId);
      const providerName = provider?.name || providerId;

      // Show success notification
      setNotification(
        `${providerName} configuration saved successfully`,
        "success"
      );

      // Return the configuration ID for use in creating keys
      return result?.data?.id;
    } catch (error) {
      console.error("Error saving provider configuration:", error);
      setNotification(
        "Failed to save configuration. Please try again.",
        "error"
      );
      return undefined;
    }
  };

  // Function to save provider key
  const saveKey = async (
    providerId: string,
    providers: Provider[]
  ): Promise<void> => {
    setSavingProvider(providerId);

    try {
      // Get the API key for this provider
      const apiKey = apiKeys[providerId];
      const keyName = keyNames[providerId] || `${providerId}-key-${Date.now()}`;

      if (!apiKey) {
        setNotification("Please enter an API key", "error");
        setSavingProvider(null);
        return;
      }

      // Get the configuration ID if it exists
      let configId = getConfigurationIdForProvider(providerId);

      // If no config exists, create one
      if (!configId) {
        configId = await saveConfig(providerId, providers);

        if (!configId) {
          setNotification("Failed to create provider configuration", "error");
          setSavingProvider(null);
          return;
        }
      }

      // Add the provider key
      await addProviderKey.mutateAsync({
        providerName: providerId,
        keyName,
        key: apiKey,
        configurationId: configId,
      });

      // Explicitly force a refetch to update the UI immediately
      await queryClient.invalidateQueries({ queryKey: ["providerConfigs"] });
      await queryClient.refetchQueries({ queryKey: ["providerConfigs"] });

      // Find provider name for notification
      const provider = providers.find((p) => p.id === providerId);
      const providerName = provider?.name || providerId;

      // Show success notification
      setNotification(`${providerName} API key saved successfully`, "success");

      setSavedProvider(providerId);

      // Reset the form for new key entry
      setApiKeys({
        ...apiKeys,
        [providerId]: "",
      });
      setKeyNames({
        ...keyNames,
        [providerId]: "",
      });

      // Reset the saved state after 3 seconds
      setTimeout(() => {
        setSavedProvider(null);
      }, 3000);
    } catch (error) {
      console.error("Error saving provider key:", error);
      setNotification("Failed to save API key. Please try again.", "error");
    } finally {
      setSavingProvider(null);
    }
  };

  // Function to delete provider key with notification handling
  const deleteKey = async (keyId: string): Promise<void> => {
    try {
      // Delete the key
      await deleteProviderKey.mutateAsync(keyId);

      // Explicitly force a refetch after deletion
      await queryClient.invalidateQueries({ queryKey: ["providerConfigs"] });
      await queryClient.refetchQueries({ queryKey: ["providerConfigs"] });

      setNotification(`API key deleted successfully`, "success");
    } catch (error) {
      console.error("Error deleting provider key:", error);
      setNotification("Failed to delete API key. Please try again.", "error");
    }
  };

  // Update API key value
  const updateApiKey = (providerId: string, value: string) => {
    setApiKeys({
      ...apiKeys,
      [providerId]: value,
    });
  };

  // Update key name value
  const updateKeyName = (providerId: string, value: string) => {
    setKeyNames({
      ...keyNames,
      [providerId]: value,
    });
  };

  // Function to view a decrypted provider key
  const viewDecryptedProviderKey = async (
    keyId: string
  ): Promise<string | null> => {
    if (!orgId || !keyId) return null;

    try {
      const jawnClient = getJawnClient(orgId);

      // Make the API call
      const response: any = await jawnClient.GET(
        `/v1/api-keys/provider-key/{providerKeyId}`,
        {
          params: {
            path: {
              providerKeyId: keyId,
            },
          },
        }
      );

      // Check for error
      if (response.error) {
        console.error(
          "Failed to fetch decrypted provider key:",
          response.error
        );
        setNotification("Failed to fetch decrypted key", "error");
        return null;
      }

      // First check if the response is directly the provider key data
      if (response && typeof response === "object") {
        // Check all possible response formats
        if (response.provider_key) {
          return response.provider_key;
        } else if (response.data && response.data.provider_key) {
          return response.data.provider_key;
        } else if (typeof response.data === "string") {
          return response.data;
        }
      }

      return null;
    } catch (error) {
      console.error(`Error fetching decrypted key for keyId ${keyId}:`, error);
      setNotification("Error fetching decrypted key", "error");
      return null;
    }
  };

  // Add a function to refetch provider configurations
  const refetchProviderConfigs = async () => {
    await queryClient.invalidateQueries({ queryKey: ["providerConfigs"] });
    return queryClient.refetchQueries({ queryKey: ["providerConfigs"] });
  };

  return {
    // Data and loading states
    providerConfigs,
    isLoadingConfigs,
    apiKeys,
    keyNames,
    savingProvider,
    savedProvider,

    // Mutation functions
    upsertProviderConfig,
    addProviderKey,
    deleteProviderKey,

    // Helper functions
    getProviderKeysForProvider,
    getConfigurationIdForProvider,
    viewDecryptedProviderKey,
    refetchProviderConfigs,

    // Enhanced functions with built-in error handling and notifications
    saveConfig,
    saveKey,
    deleteKey,
    updateApiKey,
    updateKeyName,
  };
};
