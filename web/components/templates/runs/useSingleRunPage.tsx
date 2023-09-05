import { useCallback } from "react";
import { useGetProperties } from "../../../services/hooks/properties";
import { useGetRequests } from "../../../services/hooks/requests";
import {
  filterListToTree,
  FilterNode,
  filterUIToFilterLeafs,
} from "../../../services/lib/filters/filterDefs";
import {
  REQUEST_TABLE_FILTERS,
  SingleFilterDef,
} from "../../../services/lib/filters/frontendFilterDefs";
import {
  SortLeafRequest,
  SortLeafRun,
} from "../../../services/lib/sorts/requests/sorts";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { GET_RUNS, useGetRuns } from "../../../services/hooks/runs";
import { gql } from "../../../lib/api/graphql/client";
import { useQuery } from "@apollo/client";
import { GET_TASKS } from "../../../services/hooks/tasks";

export const useSingleRunPage = (runId: string, isLive: boolean) => {
  const { properties, isLoading: isPropertiesLoading } = useGetProperties();

  const run = useQuery(GET_RUNS, {
    variables: {
      limit: 1,
      offset: 0,
      filters: [
        {
          id: {
            equals: runId,
          },
        },
      ],
    },
    pollInterval: isLive ? 2_000 : undefined,
  });

  const tasks = useQuery(GET_TASKS, {
    variables: {
      limit: 100,
      offset: 0,
      filters: [],
      runId: runId,
    },
    pollInterval: isLive ? 2_000 : undefined,
  });

  return {
    tasks,
    run,
  };
};
