import { useOrg } from "@/components/layout/org/organizationContext";
import useNotification from "@/components/shared/notification/useNotification";
import { getJawnClient } from "@/lib/clients/jawn";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHeliconeAuth } from "@/contexts/HeliconeAuthContext";

export interface RouterConfig {
  limits?: {
    rate?: {
      requests_per_minute?: number;
      tokens_per_day?: number;
    };
    cost?: {
      max_cost_per_request?: number;
      max_cost_per_day?: number;
      currency?: string;
    };
  };
  routing_strategy?:
    | "weighted-random"
    | "round-robin"
    | "fallback-only"
    | "cost-optimized";
}

export interface RouterProviderMapping {
  id: string;
  router_id: string;
  provider_key_id: string;
  provider_key_name?: string;
  provider_name?: string;
  role: "primary" | "fallback" | "conditional";
  weight: number;
  conditions?: Record<string, any>;
}

export interface RouterConfiguration {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
  soft_delete: boolean | null;
  config: RouterConfig;
  is_active: boolean | null;
  providers?: RouterProviderMapping[];
}

export interface CreateRouterRequest {
  name: string;
  description?: string;
  config: RouterConfig;
  is_active?: boolean;
}

export interface UpdateRouterRequest {
  name?: string;
  description?: string;
  config?: RouterConfig;
  is_active?: boolean;
}

export interface AddProviderRequest {
  providerKeyId: string;
  role: "primary" | "fallback" | "conditional";
  weight?: number;
  conditions?: Record<string, any>;
}

/**
 * Hook for managing router configurations
 */
export const useRouter = () => {
  const { authToken, userId, orgId } = useHeliconeAuth();
  const { setNotification } = useNotification();
  const queryClient = useQueryClient();

  // Safely handle the response data and error checking
  const safelyHandleResponse = (response: any) => {
    // If response is undefined or null
    if (!response) {
      return [];
    }

    // If there's an error
    if (response.error) {
      console.error("API Error:", response.error);
      return [];
    }

    // If data is missing
    if (!response.data) {
      return [];
    }

    return response.data;
  };

  // Query keys for cache management
  const routersQueryKey = ["routers", orgId];
  const providerKeysQueryKey = ["provider-keys", orgId];

  // Query to fetch router configurations
  const {
    data: routers,
    isLoading,
    error: routersError,
    refetch: refetchRouters,
  } = useQuery({
    queryKey: routersQueryKey,
    queryFn: async () => {
      if (!orgId) return [];

      try {
        const jawnClient = getJawnClient(orgId);
        const response = await jawnClient.GET("/v1/router", {});

        console.log("Router response:", response);
        return safelyHandleResponse(response);
      } catch (error) {
        console.error("Failed to fetch router configurations:", error);
        return [];
      }
    },
    enabled: !!orgId,
  });

  // Query to fetch provider keys
  const { data: providerKeys } = useQuery({
    queryKey: providerKeysQueryKey,
    queryFn: async () => {
      if (!orgId) return [];

      try {
        const jawnClient = getJawnClient(orgId);
        // Use the correct endpoint for provider keys
        const response = await jawnClient.GET("/v1/api-keys/provider-keys", {});

        console.log("Provider keys response:", response);
        return safelyHandleResponse(response);
      } catch (error) {
        console.error("Failed to fetch provider keys:", error);
        return [];
      }
    },
    enabled: !!orgId,
  });

  // Get router by ID
  const getRouterById = (routerId: string): RouterConfiguration | undefined => {
    if (!routers || !Array.isArray(routers)) return undefined;
    return routers.find((router) => router.id === routerId);
  };

  // Mutation to create a new router configuration
  const createRouter = useMutation({
    mutationFn: async (data: CreateRouterRequest) => {
      if (!orgId) throw new Error("No organization selected");

      const jawnClient = getJawnClient(orgId);
      const response = await jawnClient.POST("/v1/router", {
        body: data,
      });

      console.log("Create router response:", response);
      return safelyHandleResponse(response);
    },
    onSuccess: () => {
      setNotification({
        type: "success",
        title: "Router created successfully",
        description: "Your new router has been created",
      });
      queryClient.invalidateQueries({ queryKey: routersQueryKey });
    },
    onError: (error: any) => {
      setNotification({
        type: "error",
        title: "Failed to create router",
        description:
          error.message || "An error occurred while creating the router",
      });
    },
  });

  // Mutation to update an existing router configuration
  const updateRouter = useMutation({
    mutationFn: async ({
      routerId,
      data,
    }: {
      routerId: string;
      data: UpdateRouterRequest;
    }) => {
      if (!orgId) {
        throw new Error("Organization ID is required");
      }

      const jawnClient = getJawnClient(orgId);
      const response = await jawnClient.PUT(`/v1/router/${routerId}`, {
        body: data,
      });

      console.log("Update router response:", response);

      if (response && response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      setNotification({
        type: "success",
        title: "Router updated successfully",
        description: "Your router has been updated",
      });
      queryClient.invalidateQueries({ queryKey: routersQueryKey });
    },
    onError: (error: any) => {
      setNotification({
        type: "error",
        title: "Failed to update router",
        description:
          error.message || "An error occurred while updating the router",
      });
    },
  });

  // Mutation to delete a router configuration
  const deleteRouter = useMutation({
    mutationFn: async (routerId: string) => {
      if (!orgId) {
        throw new Error("Organization ID is required");
      }

      const jawnClient = getJawnClient(orgId);
      const response = await jawnClient.DELETE(`/v1/router/${routerId}`, {});

      console.log("Delete router response:", response);

      if (response && response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      setNotification({
        type: "success",
        title: "Router deleted successfully",
        description: "Your router has been deleted",
      });
      queryClient.invalidateQueries({ queryKey: routersQueryKey });
    },
    onError: (error: any) => {
      setNotification({
        type: "error",
        title: "Failed to delete router",
        description:
          error.message || "An error occurred while deleting the router",
      });
    },
  });

  // Mutation to add a provider to a router
  const addProviderToRouter = useMutation({
    mutationFn: async ({
      routerId,
      data,
    }: {
      routerId: string;
      data: AddProviderRequest;
    }) => {
      if (!orgId) {
        throw new Error("Organization ID is required");
      }

      const jawnClient = getJawnClient(orgId);
      const response = await jawnClient.POST(
        `/v1/router/${routerId}/providers`,
        {
          body: data,
        }
      );

      console.log("Add provider response:", response);

      if (response && response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      setNotification({
        type: "success",
        title: "Provider added successfully",
        description: "The provider has been added to the router",
      });
      queryClient.invalidateQueries({ queryKey: routersQueryKey });
    },
    onError: (error: any) => {
      setNotification({
        type: "error",
        title: "Failed to add provider",
        description:
          error.message || "An error occurred while adding the provider",
      });
    },
  });

  // Mutation to remove a provider from a router
  const removeProviderFromRouter = useMutation({
    mutationFn: async ({
      routerId,
      mappingId,
    }: {
      routerId: string;
      mappingId: string;
    }) => {
      if (!orgId) throw new Error("No organization selected");

      const jawnClient = getJawnClient(orgId);
      const response = await jawnClient.DELETE(
        `/v1/router/${routerId}/providers/${mappingId}`,
        {}
      );

      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      setNotification("Provider removed from router", "success");
      queryClient.invalidateQueries({ queryKey: routersQueryKey });
    },
    onError: (error: Error) => {
      setNotification(
        `Failed to remove provider: ${error.message || "Unknown error"}`,
        "error"
      );
    },
  });

  // Mutation to update a provider mapping
  const updateProviderMapping = useMutation({
    mutationFn: async ({
      routerId,
      mappingId,
      data,
    }: {
      routerId: string;
      mappingId: string;
      data: {
        role?: "primary" | "fallback" | "conditional";
        weight?: number;
        conditions?: Record<string, any>;
      };
    }) => {
      if (!orgId) throw new Error("No organization selected");

      const jawnClient = getJawnClient(orgId);
      const response = await jawnClient.PUT(
        `/v1/router/${routerId}/providers/${mappingId}`,
        {
          body: data,
        }
      );

      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      setNotification("Provider mapping updated", "success");
      queryClient.invalidateQueries({ queryKey: routersQueryKey });
    },
    onError: (error: Error) => {
      setNotification(
        `Failed to update provider mapping: ${
          error.message || "Unknown error"
        }`,
        "error"
      );
    },
  });

  // Mutation to associate a router with a proxy key
  const associateRouterWithProxyKey = useMutation({
    mutationFn: async ({
      routerId,
      proxyKeyId,
    }: {
      routerId: string;
      proxyKeyId: string;
    }) => {
      if (!orgId) throw new Error("No organization selected");

      const jawnClient = getJawnClient(orgId);
      const response = await jawnClient.POST(
        `/v1/router/${routerId}/proxy-key`,
        {
          body: {
            proxyKeyId,
          },
        }
      );

      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      setNotification("Router associated with proxy key", "success");
      queryClient.invalidateQueries({ queryKey: routersQueryKey });
    },
    onError: (error: Error) => {
      setNotification(
        `Failed to associate router with proxy key: ${
          error.message || "Unknown error"
        }`,
        "error"
      );
    },
  });

  return {
    // Data
    routers,
    providerKeys,
    isLoading,
    routersError,
    refetchRouters,
    getRouterById,

    // Mutations
    createRouter,
    updateRouter,
    deleteRouter,
    addProviderToRouter,
    removeProviderFromRouter,
    updateProviderMapping,
    associateRouterWithProxyKey,
  };
};
