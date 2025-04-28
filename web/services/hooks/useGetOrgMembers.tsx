import { $JAWN_API } from "@/lib/clients/jawn";

const useGetOrgMembers = (orgId: string) => {
  const { data, isLoading, refetch } = $JAWN_API.useQuery(
    "get",
    "/v1/organization/{organizationId}/members",
    {
      params: {
        path: {
          organizationId: orgId,
        },
      },
    },
    {
      refetchOnWindowFocus: false,
    }
  );
  return {
    data: data?.data || [],
    isLoading,
    refetch,
  };
};
