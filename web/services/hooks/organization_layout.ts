import { useQuery } from "@tanstack/react-query";
import { Result } from "../../lib/result";
import { OrganizationLayout } from "../lib/organization_layout/organization_layout";
import { getJawnClient } from "../../lib/clients/jawn";

const useOrganizationLayout = (
  orgId: string,
  layoutPage: "dashboard" | "requests",
  initialData?: Result<OrganizationLayout | null, string>
) => {
  const jawn = getJawnClient(orgId);
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["organizationLayout", orgId, layoutPage],
    initialData: initialData ? () => initialData : undefined,
    queryFn: async (query) => {
      const orgId = query.queryKey[1];
      const filterType = query.queryKey[2];
      const { data: layout, error } = await jawn.GET(
        "/v1/organization/{organizationId}/layout",
        {
          params: {
            path: {
              organizationId: orgId,
            },
            query: {
              filterType,
            },
          },
        }
      );

      if (error) {
        return { data: null };
      }
      return { data: layout.data as OrganizationLayout };
    },
    refetchOnWindowFocus: false,
  });

  return {
    isLoading,
    refetch,
    isRefetching,
    organizationLayout: data,
  };
};

export { useOrganizationLayout };
