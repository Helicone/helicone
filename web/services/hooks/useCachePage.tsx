import { useQuery } from "@tanstack/react-query";
import { Result } from "../../lib/result";

export function useCachePage() {
  const totalCached = useQuery({
    queryKey: ["totalCached"],
    queryFn: async () => {
      const data = fetch("/api/cache/total").then(
        (res) => res.json() as Promise<Result<number, string>>
      );
      return data;
    },
  });

  const totalSavings = useQuery({
    queryKey: ["totalSavings"],
    queryFn: async () => {
      const data = fetch("/api/cache/total_savings").then(
        (res) => res.json() as Promise<Result<number, string>>
      );
      return data;
    },
  });

  const avgSecondsSaved = useQuery({
    queryKey: ["totalSavings"],
    queryFn: async () => {
      const data = fetch("/api/cache/total_savings").then(
        (res) => res.json() as Promise<Result<number, string>>
      );
      return data;
    },
  });

  return {
    totalCached,
    totalSavings,
    avgSecondsSaved,
  };
}
