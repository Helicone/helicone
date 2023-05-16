import { useQuery } from "@tanstack/react-query";
import { statusCodesLastMonth } from "../../lib/api/error/stats";
import { HeliconeRequest } from "../../lib/api/request/request";
import { Result, resultMap } from "../../lib/result";
import { getModelUsageOverTimeBackFill } from "../../pages/api/cache/over_time";
import { FilterNode } from "../lib/filters/filterDefs";
import { SortLeafRequest } from "../lib/sorts/requests/sorts";

export function useErrorPageCodes() {
  const errorCodes = useQuery({
    queryKey: ["errorCodes"],
    queryFn: async () => {
      const data = fetch("/api/error/codes").then(
        (res) => res.json() as ReturnType<typeof statusCodesLastMonth>
      );
      return data;
    },
    refetchOnWindowFocus: false,
  });

  return {
    errorCodes,
  };
}

export function useErrorPageOverTime() {
  const overTime = useQuery({
    queryKey: ["overTime"],
    queryFn: async () => {
      const data = fetch("/api/error/over_time").then(
        (res) => res.json() as ReturnType<typeof getModelUsageOverTimeBackFill>
      );
      return data;
    },
  });

  overTime.data &&
    resultMap(overTime.data, (result) => {
      const allErrors = new Set<string>();
      result.forEach((entry) => {
        Object.keys(entry).forEach((model) => {
          allErrors.add(model);
        });
      });
      allErrors.delete("time");
      const x = result.map((entry) => {
        allErrors.forEach((model) => {
          if (!entry[model]) {
            entry[model] = 0;
          }
        });
        return entry;
      });
    });

  return {
    overTime,
  };
}

export function useErrorPageLatest() {
  const latestErrors = useQuery({
    queryKey: ["latestErrorsData"],
    queryFn: async (query) => {
      return await fetch("/api/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: {
            response: {
              status: {
                "not-equals": 200,
              },
            },
          },
          offset: 0,
          limit: 25,
          sort: {
            created_at: "desc",
          },
        } as {
          filter: FilterNode;
          offset: number;
          limit: number;
          sort: SortLeafRequest;
        }),
      }).then(
        (res) => res.json() as Promise<Result<HeliconeRequest[], string>>
      );
    },
    refetchOnWindowFocus: false,
  });

  return {
    latestErrors,
  };
}
