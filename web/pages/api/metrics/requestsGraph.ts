// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";

import { FilterLeaf, FilterNode } from "../../../lib/api/metrics/filters";
import { getTimeData } from "../../../lib/api/metrics/getTimeData";
import { Result } from "../../../lib/result";
import {
  TimeData,
  TimeIncrement,
} from "../../../lib/timeCalculations/fetchTimeData";
import { timeBackfill } from "../../../lib/timeCalculations/time";

export async function getRequestsGraph(
  filter: FilterLeaf,
  userId: string,
  dbIncrement: TimeIncrement,
  timeZoneDifference: number
): Promise<Result<TimeData[], string>> {
  const { data, error } = await getTimeData(
    filter,
    userId,
    dbIncrement,
    timeZoneDifference
  );
  if (error !== null) {
    return { data: null, error: error };
  }
  console.log("GTE", filter!.request!.created_at!.gte!);
  console.log("LTE", filter!.request!.created_at!.lte!);
  return {
    data: timeBackfill(
      data,
      new Date(filter!.request!.created_at!.gte!),
      new Date(filter!.request!.created_at!.lte!)
    ),
    error: null,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<TimeData[], string>>
) {
  const client = createServerSupabaseClient({ req, res });
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const { filter, dbIncrement, timeZoneDifference } = req.body as {
    filter: FilterLeaf;
    dbIncrement: TimeIncrement;
    timeZoneDifference: number;
  };

  if (!filter || !dbIncrement) {
    res.status(400).json({ error: "Bad request", data: null });
    return;
  }

  const metrics = await getRequestsGraph(
    filter,
    user.data.user.id,
    dbIncrement,
    timeZoneDifference
  );
  console.log("TZ", timeZoneDifference);
  if (metrics.error !== null) {
    res.status(500).json(metrics);
    return;
  }

  res.status(200).json({
    data: metrics.data,
    error: null,
  });
}
