import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useJawnClient } from "@/lib/clients/jawnHook";

export interface PropertyMetadata {
  id: string;
  created_at: string;
  updated_at: string;
  property_key: string;
  description: string | null;
  soft_delete: boolean;
  deleted_at: string | null;
}

export interface CreatePropertyMetadataParams {
  property_key: string;
  description?: string;
}

export interface UpdatePropertyMetadataParams {
  description?: string;
  soft_delete?: boolean;
}

export const usePropertyMetadata = () => {
  const jawn = useJawnClient();
  const queryClient = useQueryClient();

  // Get all property metadata
  const useAllPropertyMetadata = () => {
    return useQuery({
      queryKey: ["property-metadata"],
      queryFn: async () => {
        const response = await jawn.GET("/v1/property-metadata", {});
        if (response.error) throw response.error;
        return response.data;
      },
    });
  };

  // Get property metadata by key
  const usePropertyMetadataByKey = (propertyKey: string) => {
    return useQuery({
      queryKey: ["property-metadata", propertyKey],
      queryFn: async () => {
        const response = await jawn.GET("/v1/property-metadata/{propertyKey}", {
          params: { path: { propertyKey } },
        });
        if (response.error) throw response.error;
        return response.data;
      },
      enabled: !!propertyKey,
    });
  };

  // Create property metadata
  const useCreatePropertyMetadata = () => {
    return useMutation({
      mutationFn: async (params: CreatePropertyMetadataParams) => {
        const response = await jawn.POST("/v1/property-metadata", {
          body: params,
        });
        if (response.error) throw response.error;
        return response.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["property-metadata"] });
      },
    });
  };

  // Update property metadata
  const useUpdatePropertyMetadata = () => {
    return useMutation({
      mutationFn: async ({
        propertyKey,
        params,
      }: {
        propertyKey: string;
        params: UpdatePropertyMetadataParams;
      }) => {
        const response = await jawn.PUT("/v1/property-metadata/{propertyKey}", {
          params: { path: { propertyKey } },
          body: params,
        });
        if (response.error) throw response.error;
        return response.data;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: ["property-metadata", variables.propertyKey],
        });
        queryClient.invalidateQueries({ queryKey: ["property-metadata"] });
      },
    });
  };

  // Delete property metadata
  const useDeletePropertyMetadata = () => {
    return useMutation({
      mutationFn: async (propertyKey: string) => {
        const response = await jawn.DELETE(
          "/v1/property-metadata/{propertyKey}",
          {
            params: { path: { propertyKey } },
          }
        );
        if (response.error) throw response.error;
        return response.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["property-metadata"] });
      },
    });
  };

  return {
    useAllPropertyMetadata,
    usePropertyMetadataByKey,
    useCreatePropertyMetadata,
    useUpdatePropertyMetadata,
    useDeletePropertyMetadata,
  };
};
