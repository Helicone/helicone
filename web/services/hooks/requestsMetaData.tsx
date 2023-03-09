import { useQuery } from "@tanstack/react-query";
import { HeliconeRequest } from "../../lib/api/request/request";
import { RequestMetaData } from "../../lib/api/request/requestMetaData";
import { Result } from "../../lib/result";

const useGetRequestsMetaData = (requestIds: string[]) => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["requests", requestIds],
    queryFn: async (query) => {
      const requestIds = query.queryKey[1] as string[];

      return await fetch("/api/request/metaData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestIds,
        }),
      }).then(
        (res) => res.json() as Promise<Result<RequestMetaData[], string>>
      );
    },
    refetchOnWindowFocus: false,
  });

  return {
    requestMetaData: data?.data ?? [],
    isLoading,
    refetch,
    isRefetching,
  };
};

export { useGetRequestsMetaData };
