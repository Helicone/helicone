import { useQuery } from "@tanstack/react-query";
import { PublicHeliconeStatsResult } from "../../pages/api/public-stats";

const usePublicStats = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["publicStats"],
    queryFn: async () => {
      return fetch("/api/public-stats").then(
        (res) => res.json() as Promise<PublicHeliconeStatsResult>
      );
    },
    refetchOnWindowFocus: false,
  });

  return {
    stats: data?.data ?? null,
    isLoading,
    error,
    errorMessage: data?.error ?? null,
    refetch,
  };
};

export { usePublicStats };
