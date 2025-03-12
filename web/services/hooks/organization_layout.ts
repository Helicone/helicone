import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Result } from "../../lib/result";
import {
  OrganizationFilter,
  OrganizationLayout,
} from "../lib/organization_layout/organization_layout";
import { getJawnClient } from "../../lib/clients/jawn";
import { useOrg } from "../../components/layout/org/organizationContext";

/**
 * Hook to fetch organization layouts
 */
const useOrganizationLayout = (
  layoutPage: "dashboard" | "requests" | "filter_ast",
  initialData?: Result<OrganizationLayout | null, string>
) => {
  const org = useOrg();
  const orgId = org?.currentOrg?.id;
  const jawn = orgId ? getJawnClient(orgId) : null;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["organizationLayout", orgId, layoutPage],
    initialData: initialData ? () => initialData : undefined,
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string | undefined;
      const filterType = query.queryKey[2];
      if (!orgId) {
        return { data: null };
      }

      const jawnClient = getJawnClient(orgId);

      // Use type assertion to handle the path parameter
      const endpoint = `/v1/organization/${orgId}/layout`;
      const { data: layout, error } = await jawnClient.GET(endpoint as any, {
        params: {
          path: {
            organizationId: orgId,
          },
          query: {
            filterType,
          },
        },
      });

      if (error) {
        return { data: null };
      }
      return { data: layout.data as OrganizationLayout };
    },
    refetchOnWindowFocus: false,
    enabled: !!orgId,
  });

  const queryClient = useQueryClient();

  // Create a new organization layout
  const createLayout = useMutation({
    mutationFn: async (filters: OrganizationFilter[]) => {
      if (!orgId || !jawn) throw new Error("No organization selected");

      const { data: result, error } = await jawn.POST(
        "/v1/organization/{organizationId}/create_layout",
        {
          params: {
            path: {
              organizationId: orgId,
            },
          },
          body: {
            type: layoutPage,
            filters,
          },
        }
      );

      if (error) throw new Error(error);
      return result.data;
    },
    onSuccess: () => {
      if (orgId) {
        queryClient.invalidateQueries({
          queryKey: ["organizationLayout", orgId, layoutPage],
        });
      }
    },
  });

  // Update an existing organization layout
  const updateLayout = useMutation({
    mutationFn: async (filters: OrganizationFilter[]) => {
      if (!orgId || !jawn) throw new Error("No organization selected");

      const { data: result, error } = await jawn.POST(
        "/v1/organization/{organizationId}/update_layout",
        {
          params: {
            path: {
              organizationId: orgId,
            },
          },
          body: {
            type: layoutPage,
            filters,
          },
        }
      );

      if (error) throw new Error(error);
      return result.data;
    },
    onSuccess: () => {
      if (orgId) {
        queryClient.invalidateQueries({
          queryKey: ["organizationLayout", orgId, layoutPage],
        });
      }
    },
  });

  // Delete an organization layout
  const deleteLayout = useMutation({
    mutationFn: async () => {
      if (!orgId || !jawn) throw new Error("No organization selected");

      const { error } = await jawn.DELETE(
        "/v1/organization/{organizationId}/layout",
        {
          params: {
            path: {
              organizationId: orgId,
            },
            query: {
              type: layoutPage,
            },
          },
        }
      );

      if (error) throw new Error(error);
      return true;
    },
    onSuccess: () => {
      if (orgId) {
        queryClient.invalidateQueries({
          queryKey: ["organizationLayout", orgId, layoutPage],
        });
      }
    },
  });

  return {
    isLoading,
    refetch,
    isRefetching,
    organizationLayout: data?.data,
    createLayout,
    updateLayout,
    deleteLayout,
  };
};

export { useOrganizationLayout };
