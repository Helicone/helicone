// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

import { getMetrics, Metrics } from "../../../lib/api/metrics/metrics";
import { Result } from "../../../lib/result";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<Metrics, string>>
) {
  const client = new SupabaseServerWrapper({ req, res }).getClient();
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
