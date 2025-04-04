import { $JAWN_API } from "../../../lib/clients/jawn";

const useGetDataSets = (promptId?: string) => {
  const { data, isLoading, refetch, isRefetching } = $JAWN_API.useQuery(
    "post",
    "/v1/experiment/dataset/query",
    {
      body: {
        promptVersionId: promptId,
      },
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  return {
    isLoading,
    refetch,
    isRefetching,
    datasets: data?.data ?? [],
  };
};

export { useGetDataSets };
