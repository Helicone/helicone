import { useQuery } from "@tanstack/react-query";
import { useJawnClient } from "../../../lib/clients/jawnHook";

const useGetDataSets = (promptId?: string) => {
  const jawn = useJawnClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["datasets", jawn],
    queryFn: async (query) => {
      const jawn = query.queryKey[1] as ReturnType<typeof useJawnClient>;

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
