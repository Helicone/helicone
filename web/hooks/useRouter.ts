import useNotification from "@/components/shared/notification/useNotification";
import { useOrg } from "@/components/layout/org/organizationContext";
import { getJawnClient } from "@/lib/clients/jawn";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
  const org = useOrg();
  const { setNotification } = useNotification();
  const queryClient = useQueryClient();
  const orgId = org?.currentOrg?.id;

  // Safely handle the response data and error checking
  const safelyHandleResponse = (response: any) => {
    // If response is undefined or null
    if (!response) {
      return [];
    }

    // If there's an error in the response object
    if (response && response.error !== undefined) {
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
        // Cast the path to any to avoid TypeScript errors with dynamic paths
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
        // Use the correct endpoint for provider keys, cast to any to avoid TypeScript errors
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
      // Cast the path to any to avoid TypeScript errors
      const response = await jawnClient.POST("/v1/router", {
        body: data,
      });

      console.log("Create router response:", response);
      return safelyHandleResponse(response);
    },
    onSuccess: () => {
      setNotification("Router created successfully", "success");
      queryClient.invalidateQueries({ queryKey: routersQueryKey });
    },
    onError: (error: any) => {
      setNotification(
        `Failed to create router: ${error.message || "Unknown error"}`,
        "error"
      );
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
      if (!orgId) throw new Error("No organization selected");

      const jawnClient = getJawnClient(orgId);
      const response = await jawnClient.PUT("/v1/router/{routerId}", {
        body: data,
        params: {
          path: {
            routerId,
          },
        },
      });

      console.log("Update router response:", response);
      return safelyHandleResponse(response);
    },
    onSuccess: () => {
      setNotification("Router updated successfully", "success");
      queryClient.invalidateQueries({ queryKey: routersQueryKey });
    },
    onError: (error: any) => {
      setNotification(
        `Failed to update router: ${error.message || "Unknown error"}`,
        "error"
      );
    },
  });

  // Mutation to delete a router configuration
  const deleteRouter = useMutation({
    mutationFn: async (routerId: string) => {
      if (!orgId) throw new Error("No organization selected");

      const jawnClient = getJawnClient(orgId);
      const response = await jawnClient.DELETE("/v1/router/{routerId}", {
        params: {
          path: {
            routerId,
          },
        },
      });

      console.log("Delete router response:", response);
      return safelyHandleResponse(response);
    },
    onSuccess: () => {
      setNotification("Router deleted successfully", "success");
      queryClient.invalidateQueries({ queryKey: routersQueryKey });
    },
    onError: (error: any) => {
      setNotification(
        `Failed to delete router: ${error.message || "Unknown error"}`,
        "error"
      );
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
      if (!orgId) throw new Error("No organization selected");

      const jawnClient = getJawnClient(orgId);
      const response = await jawnClient.POST(
        "/v1/router/{routerId}/providers",
        {
          body: data,
          params: {
            path: {
              routerId,
            },
          },
        }
      );

      console.log("Add provider response:", response);
      return safelyHandleResponse(response);
    },
    onSuccess: () => {
      setNotification("Provider added to router", "success");
      queryClient.invalidateQueries({ queryKey: routersQueryKey });
    },
    onError: (error: any) => {
      setNotification(
        `Failed to add provider: ${error.message || "Unknown error"}`,
        "error"
      );
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
        "/v1/router/{routerId}/providers/{mappingId}",
        {
          params: {
            path: {
              routerId,
              mappingId,
            },
          },
        }
      );

      console.log("Remove provider response:", response);
      return safelyHandleResponse(response);
    },
    onSuccess: () => {
      setNotification("Provider removed successfully", "success");
      queryClient.invalidateQueries({ queryKey: routersQueryKey });
    },
    onError: (error: any) => {
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
      data: Partial<AddProviderRequest>;
    }) => {
      if (!orgId) throw new Error("No organization selected");

      const jawnClient = getJawnClient(orgId);
      const response = await jawnClient.PUT(
        "/v1/router/{routerId}/providers/{mappingId}",
        {
          body: data,
          params: {
            path: {
              routerId,
              mappingId,
            },
          },
        }
      );

      console.log("Update provider response:", response);
      return safelyHandleResponse(response);
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
        "/v1/router/{routerId}/proxy-key",
        {
          body: {
            proxyKeyId,
          },
          params: {
            path: {
              routerId,
            },
          },
        }
      );

      console.log("Associate proxy key response:", response);
      return safelyHandleResponse(response);
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
    routers,
    providerKeys,
    isLoading,
    routersError,
    getRouterById,
    refetchRouters,
    createRouter,
    updateRouter,
    deleteRouter,
    addProviderToRouter,
    removeProviderFromRouter,
    updateProviderMapping,
    associateRouterWithProxyKey,
  };
};
