// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { getRequestCount } from "../../../lib/api/request/request";

import {
  UserMetric,
  userMetrics,
  userMetricsCount,
} from "../../../lib/api/users/users";
import { Result } from "../../../lib/result";
import { FilterNode } from "../../../services/lib/filters/filterDefs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<number, string>>
) {
  const client = createServerSupabaseClient({ req, res });
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const { filter } = req.body as {
    filter: FilterNode;
  };
  const metrics = await getRequestCount(user.data.user.id, filter);
  res.status(metrics.error === null ? 200 : 500).json(metrics);
}
