import { useQuery } from "@tanstack/react-query";
import { RequestMetaData } from "../../lib/api/request/metadata";
import { Result } from "../../lib/result";

const useGetRequestMetaData = (requestId: string) => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["requests", requestId],
    queryFn: async (query) => {
      const requestId = query.queryKey[1] as string;

      return fetch(`/api/request/${requestId}/metaData`).then(
        (res) => res.json() as Promise<Result<RequestMetaData[], string>>
      );
    },
    refetchOnWindowFocus: false,
  });

  return {
    metaData: data?.data ?? [],
    isLoading,
    refetch,
    isRefetching,
  };
};

export { useGetRequestMetaData };
