import { useQuery } from "@tanstack/react-query";
import { OrganizationLayout } from "../lib/organization_layout/organization_layout";
import { Result } from "../../lib/result";

const useOrganizationLayout = (
  orgId: string,
  layoutPage: "dashboard" | "requests",
  initialData?: Result<OrganizationLayout, string>
) => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["organizationLayout", orgId, layoutPage],
    initialData: initialData ? () => initialData : undefined,
    queryFn: async (query) => {
      const orgId = query.queryKey[1];
      const type = query.queryKey[2];
      return await fetch(`/api/organization/${orgId}/layout?type=${type}`, {
        headers: {
          "Content-Type": "application/json",
        },
      }).then(
        (res) => res.json() as Promise<Result<OrganizationLayout, string>>
      );
    },
    refetchOnWindowFocus: false,
  });

  return {
    isLoading,
    refetch,
    isRefetching,
    organizationLayout: data?.data,
  };
};

export { useOrganizationLayout };
