import { useQuery } from "@tanstack/react-query";
import { useOrg } from "../../../components/layout/org/organizationContext";
import { getJawnClient } from "../../../lib/clients/jawn";

export const useInputs = (promptVersionId?: string) => {
  const org = useOrg();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["prompts", org?.currentOrg?.id, promptVersionId],
    queryFn: async (query) => {
      const promptVersionId = query.queryKey[2] as string | undefined;
      if (!promptVersionId) return;
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);

      return jawn.POST("/v1/prompt/version/{promptVersionId}/inputs/query", {
        params: {
          path: {
            promptVersionId: promptVersionId,
          },
        },
        body: {
          limit: 100,
        },
      });
    },
    refetchOnWindowFocus: false,
  });

  return {
    isLoading,
    refetch,
    isRefetching,
    inputs: data?.data?.data,
  };
};
