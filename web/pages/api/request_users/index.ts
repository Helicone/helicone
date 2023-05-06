// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

import { UserMetric, userMetrics } from "../../../lib/api/users/users";
import { Result } from "../../../lib/result";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { SortLeafUsers } from "../../../services/lib/sorts/users/sorts";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<UserMetric[], string>>
) {
  const client = new SupabaseServerWrapper({ req, res }).getClient();
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const { filter, offset, limit, sort } = req.body as {
    filter: FilterNode;
    offset: number;
    limit: number;
    sort: SortLeafUsers;
  };
  const { error: metricsError, data: metrics } = await userMetrics(
    user.data.user.id,
    filter,
    offset,
    limit,
    sort
  );
  if (metricsError !== null) {
    res.status(500).json({ error: metricsError, data: null });
    return;
  }

  res.status(200).json({ error: null, data: metrics });
}
