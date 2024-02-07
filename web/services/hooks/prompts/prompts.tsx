import { useQuery } from "@tanstack/react-query";

import { UserMetric } from "../../../lib/api/users/users";
import { Result } from "../../../lib/result";
import { FilterNode } from "../../lib/filters/filterDefs";
import { SortLeafUsers } from "../../lib/sorts/users/sorts";

const usePrompts = () => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["prompts"],
    queryFn: async (query) => {
      const prompts = await fetch("/api/prompt", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }).then(
        (res) =>
          res.json() as Promise<
            Result<
              {
                id: string;
                latest_version: number;
              }[],
              string
            >
          >
      );

      return {
        prompts,
      };
    },
    refetchOnWindowFocus: false,
  });

  return {
    isLoading,
    refetch,
    isRefetching,
    prompts: data?.prompts,
  };
};

export { usePrompts };
