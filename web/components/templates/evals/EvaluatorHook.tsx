import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { getJawnClient } from "../../../lib/clients/jawn";
import {
  TimeInterval,
  getTimeIntervalAgo,
} from "../../../lib/timeCalculations/time";
import { useDebounce } from "../../../services/hooks/debounce";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { getRootFilterNode } from "../../../services/lib/filters/uiFilterRowTree";
import { UIFilterRowTree } from "@/services/lib/filters/types";
import { useOrg } from "../../layout/org/organizationContext";
import useSearchParams, {
  SearchParams,
} from "../../shared/utils/useSearchParams";
import { TimeFilter } from "@/types/timeFilter";
import { useUIFilterConvert } from "../dashboard/useDashboardPage";

// Import Shadcn UI components for dropdown
const getTimeFilterWithSearchParams = (searchParams: SearchParams) => {
  const currentTimeFilter = searchParams.get("t");
  let range;

  if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
    const start = currentTimeFilter.split("_")[1]
      ? new Date(currentTimeFilter.split("_")[1])
      : getTimeIntervalAgo("24h");
    const end = new Date(currentTimeFilter.split("_")[2] || new Date());
    range = {
      start,
      end,
    };
  } else {
    range = {
      start: getTimeIntervalAgo((currentTimeFilter as TimeInterval) || "1m"),
      end: new Date(),
    };
  }
  return range;
};

export const useEvaluators = () => {
  const org = useOrg();
  const evaluators = useQuery({
    queryKey: ["evaluators", org?.currentOrg?.id],
    queryFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id!);
      return jawn.POST("/v1/evaluator/query", {
        body: {},
      });
    },
  });

  const deleteEvaluator = useMutation({
    mutationFn: async (evaluatorId: string) => {
      const jawn = getJawnClient(org?.currentOrg?.id!);
      return jawn.DELETE("/v1/evaluator/{evaluatorId}", {
        params: {
          path: {
            evaluatorId,
          },
        },
      });
    },
    onSuccess: () => {
      evaluators.refetch();
    },
  });

  return {
    evaluators,

    deleteEvaluator,
  };
};

export const useInvalidateEvaluators = () => {
  const queryClient = useQueryClient();
  const org = useOrg();

  return {
    invalidate: () => {
      queryClient.invalidateQueries({
        queryKey: ["evaluators", org?.currentOrg?.id],
      });
    },
  };
};
