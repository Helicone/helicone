// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";

import { UserMetric, userMetrics } from "../../../lib/api/users/users";
import { Result } from "../../../lib/result";
import { FilterNode } from "../../../services/lib/filters/filterDefs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<UserMetric[], string>>
) {
  const client = createServerSupabaseClient({ req, res });
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const { filter, offset, limit } = req.body as {
    filter: FilterNode;
    offset: number;
    limit: number;
  };
  const metrics = await userMetrics(user.data.user.id, filter, offset, limit);
  res.status(metrics.error === null ? 200 : 500).json(metrics);
}
