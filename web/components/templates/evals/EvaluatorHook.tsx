import { ChartBarIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useState } from "react";
import { getJawnClient } from "../../../lib/clients/jawn";
import {
  TimeInterval,
  getTimeIntervalAgo,
} from "../../../lib/timeCalculations/time";
import { useDebounce } from "../../../services/hooks/debounce";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  UIFilterRowTree,
  getRootFilterNode,
} from "../../../services/lib/filters/uiFilterRowTree";
import { useOrg } from "../../layout/organizationContext";
import AuthHeader from "../../shared/authHeader";
import LoadingAnimation from "../../shared/loadingAnimation";
import useSearchParams, {
  SearchParams,
} from "../../shared/utils/useSearchParams";
import { TimeFilter } from "../dashboard/dashboardPage";
import { useUIFilterConvert } from "../dashboard/useDashboardPage";

// Import shadcn components
import { Button } from "@/components/ui/button";

// Import Recharts components
import ThemedTable from "@/components/shared/themed/table/themedTable";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/router";

// Import Shadcn UI components for dropdown
import { CreateNewEvaluator } from "@/components/shared/CreateNewEvaluator/CreateNewEvaluator";
import { INITIAL_COLUMNS } from "./EvaluratorColumns";
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
      start: getTimeIntervalAgo((currentTimeFilter as TimeInterval) || "24h"),
      end: new Date(),
    };
  }
  return range;
};
export const useEvaluators = () => {
  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRowTree>(
    getRootFilterNode()
  );

  const debouncedAdvancedFilter = useDebounce(advancedFilters, 500);

  const searchParams = useSearchParams();

  const getTimeFilter = useCallback(() => {
    return getTimeFilterWithSearchParams(searchParams);
  }, [searchParams]);
  const [timeFilter, setTimeFilter] = useState(getTimeFilter());
  const org = useOrg();
  const {
    userFilters,
    filterMap,
    properties: { searchPropertyFilters },
  } = useUIFilterConvert(advancedFilters, timeFilter);
  const defaultEvaluators = useQuery({
    queryKey: ["evals", org?.currentOrg?.id, timeFilter, userFilters],
    queryFn: async (query) => {
      const jawn = getJawnClient(org?.currentOrg?.id!);
      const timeFilter = query.queryKey[2] as TimeFilter;
      const filter = query.queryKey[3] as FilterNode;
      return jawn.POST("/v1/evals/query", {
        body: {
          filter: filter as any,
          timeFilter: {
            start: timeFilter.start.toISOString(),
            end: timeFilter.end.toISOString(),
          },
        },
      });
    },
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const scoreDistributions = useQuery({
    queryKey: [
      "scoreDistributions",
      org?.currentOrg?.id,
      timeFilter,
      userFilters,
    ],
    queryFn: async (query) => {
      const jawn = getJawnClient(org?.currentOrg?.id!);
      const timeFilter = query.queryKey[2] as TimeFilter;
      const filter = query.queryKey[3] as FilterNode;
      return jawn.POST("/v1/evals/score-distributions/query", {
        body: {
          filter: filter as any,
          timeFilter: {
            start: timeFilter.start.toISOString(),
            end: timeFilter.end.toISOString(),
          },
        },
      });
    },
  });

  const evalScores = useQuery({
    queryKey: ["evalScores", org?.currentOrg?.id],
    queryFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id!);
      return jawn.GET("/v1/evals/scores");
    },
  });

  return {
    evalScores,
    scoreDistributions,
    defaultEvaluators,
    timeFilter,
    setTimeFilter,
    filterMap,
    advancedFilters,
    setAdvancedFilters,
    searchPropertyFilters,
  };
};
