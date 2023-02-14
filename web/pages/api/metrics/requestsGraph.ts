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
  const { filter, dbIncrement } = req.body as {
    filter: FilterLeaf;
    dbIncrement: TimeIncrement;
  };

  if (!filter || !dbIncrement) {
    res.status(400).json({ error: "Bad request", data: null });
    return;
  }

  const metrics = await getTimeData(filter, user.data.user.id, dbIncrement);
  if (metrics.error !== null) {
    res.status(500).json(metrics);
    return;
  }

  let start = null;
  console.log(filter);

  // console.log(metrics);
  res.status(200).json({
    data: timeBackfill(
      metrics.data,
      new Date(filter!.request!.created_at!.gte!),
      new Date(filter!.request!.created_at!.lte!)
    ),
    error: null,
  });
}
