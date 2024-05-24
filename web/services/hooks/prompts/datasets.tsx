import { useQuery } from "@tanstack/react-query";
import { useOrg } from "../../../components/layout/organizationContext";
import { getJawnClient } from "../../../lib/clients/jawn";

const useGetDataSets = (promptId?: string) => {
  const org = useOrg();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["datasets", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);
      return jawn.POST("/v1/experiment/dataset/query", {
        body: {
          promptId: promptId,
        },
      });
    },
    refetchOnWindowFocus: false,
  });

  return {
    isLoading,
    refetch,
    isRefetching,
    datasets: data?.data?.data ?? [],
  };
};

export { useGetDataSets };
