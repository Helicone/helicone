import { useQuery } from "@tanstack/react-query";

import { UserMetric } from "../../../lib/api/users/users";
import { Result } from "../../../lib/result";
import { FilterNode } from "../../lib/filters/filterDefs";
import { SortLeafUsers } from "../../lib/sorts/users/sorts";
import { PromptsResult } from "../../../pages/api/prompt";

const usePrompts = (id?: string) => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["prompts"],
    queryFn: async (query) => {
      const prompts = await fetch("/api/prompt", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json() as Promise<PromptsResult>);

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
