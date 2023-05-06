// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

import { userMetricsCount } from "../../../lib/api/users/users";
import { Result } from "../../../lib/result";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<number, string>>
) {
  const client = new SupabaseServerWrapper({ req, res }).getClient();
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const { filter } = req.body as {
    filter: FilterNode;
  };
  const metrics = await userMetricsCount(user.data.user.id, filter);
  res.status(metrics.error === null ? 200 : 500).json(metrics);
}
