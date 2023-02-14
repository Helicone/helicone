// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";

import { FilterNode } from "../../../lib/api/metrics/filters";
import { getMetrics, Metrics } from "../../../lib/api/metrics/metrics";
import { Result } from "../../../lib/result";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<Metrics, string>>
) {
  const client = createServerSupabaseClient({ req, res });
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const filter = req.body as FilterNode;

  if (!filter) {
    res.status(400).json({ error: "Bad request", data: null });
    return;
  }

  const metrics = await getMetrics(
    {
      client,
      user: user.data.user,
    },
    {
      filter,
    }
  );
  res.status(200).json(metrics);
}
