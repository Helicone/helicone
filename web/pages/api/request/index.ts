// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { HeliconeRequest, getRequests } from "../../../lib/api/request/request";

import { Result } from "../../../lib/result";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<HeliconeRequest[], string>>
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
    sort: SortLeafRequest;
  };

  const metrics = await getRequests(
    user.data.user.id,
    filter,
    offset,
    limit,
    sort
  );
  res.status(metrics.error === null ? 200 : 500).json(metrics);
}
