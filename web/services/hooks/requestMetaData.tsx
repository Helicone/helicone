import { useQuery } from "@tanstack/react-query";
import { RequestMetaData } from "../../lib/api/request/metadata";
import { Result } from "../../lib/result";

const useGetRequestMetaData = (requestId: string) => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["requestsMetaData"],
    queryFn: async () => {
      if (!requestId) {
        return {
          data: null,
          error: "No request id provided",
        };
      }

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
