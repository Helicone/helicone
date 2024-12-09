import { useOrg } from "@/components/layout/org/organizationContext";
import { getJawnClient } from "@/lib/clients/jawn";
import { getTimeMap } from "@/lib/timeCalculations/constants";
import { TimeIncrement } from "@/lib/timeCalculations/fetchTimeData";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { TimeFilter } from "@/types/timeFilter";
import { ScoresPanelProps } from "./ScoresPanelProps";

export function useScores({
  timeFilter,
  userFilters,
  dbIncrement,
  filterBool = false,
}: ScoresPanelProps) {
  const org = useOrg();

  const scoresQuery = useQuery({
    queryKey: [
      "scores",
      timeFilter,
      userFilters,
      dbIncrement,
      org?.currentOrg?.id,
    ],
    queryFn: async (query) => {
      const timeFilter = query.queryKey[1] as TimeFilter;
      const userFilters = query.queryKey[2] as any;
      const dbIncrement = query.queryKey[3] as TimeIncrement;
      const orgId = query.queryKey[4] as string | undefined;

      const jawn = getJawnClient(orgId);

      return await jawn.POST("/v1/dashboard/scores/query", {
        body: {
          userFilter: userFilters,
          timeFilter: {
            start: timeFilter.start.toISOString(),
            end: timeFilter.end.toISOString(),
          },
          timeZoneDifference: new Date().getTimezoneOffset(),
          dbIncrement,
        },
      });
    },
  });

  function scoreKeyToName(key: string) {
    if (key === "helicone-score-feedback") {
      return "Feedback";
    }
    return key.replace(/-hcone-bool$/, "");
  }

  const scoreKeys = useMemo(() => {
    const keys = Array.from(
      new Set(scoresQuery.data?.data?.data?.map((r) => r.score_key) ?? [])
    ).filter((s) => s !== "");

    return keys
      .filter((s) => {
        const isBoolean =
          s.endsWith("-hcone-bool") || s === "helicone-score-feedback";
        return filterBool ? isBoolean : !isBoolean;
      })
      .map(scoreKeyToName);
  }, [filterBool, scoresQuery.data?.data?.data]);

  const { allScores } = useMemo(() => {
    const allScores = scoresQuery.data?.data?.data
      ?.reduce(
        (acc, r) => {
          const existing = acc.find((a) => a.date === r.created_at_trunc);
          if (existing) {
            existing.values[scoreKeyToName(r.score_key)] = r.score_sum;
          } else {
            acc.push({
              date: r.created_at_trunc,
              values: { [scoreKeyToName(r.score_key)]: r.score_sum },
            });
          }
          return acc;
        },
        [] as {
          date: string;
          values: Record<string, number>;
        }[]
      )
      .map((r) => {
        const time = new Date(r.date);

        const values = r.values;

        for (const key of scoreKeys) {
          values[key] = values[key] ?? 0;
        }

        return {
          date: getTimeMap(dbIncrement)(time),
          ...values,
        };
      });

    return { allScores };
  }, [scoresQuery.data?.data?.data, dbIncrement, scoreKeys]);

  return { scoresQuery, allScores, scoreKeys };
}
