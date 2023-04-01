import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import {
  FilterLeaf,
  filterListToTree,
  FilterNode,
} from "../../../services/lib/filters/filterDefs";
import { Result } from "../../result";
import { TimeIncrement } from "../../timeCalculations/fetchTimeData";
import { timeBackfill } from "../../timeCalculations/time";

export interface DataOverTimeRequest {
  timeFilter: {
    start: string;
    end: string;
  };
  userFilter: FilterNode;
  userId: string;
  dbIncrement: TimeIncrement;
  timeZoneDifference: number;
}
export type OverTimeRequestQueryParams = {
  timeFilter: {
    start: string;
    end: string;
  };
  userFilters: FilterLeaf[];
  dbIncrement: TimeIncrement;
  timeZoneDifference: number;
};

export interface BackFillParams<T, K> {
  reducer: (acc: K, d: T) => K;
  initial: K;
}

export async function getSomeDataOverTime<T, K>(
  requestParams: DataOverTimeRequest,
  dataExtractor: (
    d: DataOverTimeRequest
  ) => Promise<Result<(T & { created_at_trunc: Date })[], string>>,
  backFillParams: BackFillParams<T, K>
): Promise<Result<(K & { time: Date })[], string>> {
  const { data, error } = await dataExtractor(requestParams);
  if (error !== null) {
    return { data: null, error: error };
  }

  return {
    data: timeBackfill(
      data,
      new Date(requestParams.timeFilter.start),
      new Date(requestParams.timeFilter.end),
      backFillParams.reducer,
      backFillParams.initial
    ),
    error: null,
  };
}

export async function getTimeDataHandler<T>(
  req: NextApiRequest,
  res: NextApiResponse<Result<T[], string>>,
  dataExtractor: (d: DataOverTimeRequest) => Promise<Result<T[], string>>
) {
  const client = createServerSupabaseClient({ req, res });
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const { timeFilter, userFilters, dbIncrement, timeZoneDifference } =
    req.body as OverTimeRequestQueryParams;
  if (!timeFilter || !userFilters || !dbIncrement) {
    res.status(400).json({ error: "Bad request", data: null });
    return;
  }

  const metrics = await dataExtractor({
    timeFilter,
    userFilter: {
      left: filterListToTree(userFilters, "and"),
      operator: "and",
      right: {
        left: {
          request: {
            created_at: {
              gte: timeFilter.start,
            },
          },
        },
        operator: "and",
        right: {
          request: {
            created_at: {
              lte: timeFilter.end,
            },
          },
        },
      },
    },
    userId: user.data.user.id,
    dbIncrement,
    timeZoneDifference,
  });
  if (metrics.error !== null) {
    res.status(500).json(metrics);
    return;
  }

  res.status(200).json({
    data: metrics.data,
    error: null,
  });
}
