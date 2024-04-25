import { useQuery } from "@tanstack/react-query";

import { useJawnClient } from "../../../lib/clients/jawnHook";
import { JawnFilterNode } from "../../../lib/clients/jawn";

export const useInputs = (promptVersionId?: string) => {
  const jawn = useJawnClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["prompts", jawn, promptVersionId],
    queryFn: async (query) => {
      const jawn = query.queryKey[1] as ReturnType<typeof useJawnClient>;
      const promptVersionId = query.queryKey[2] as string | undefined;
      if (!promptVersionId) return;

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
