// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getRequestsMetaData,
  RequestMetaData,
} from "../../../lib/api/request/requestMetaData";

import { Result } from "../../../lib/result";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<RequestMetaData[], string>>
) {
  const client = createServerSupabaseClient({ req, res });
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const { requestIds } = req.body as {
    requestIds: string[];
  };
  const metrics = await getRequestsMetaData(user.data.user.id, requestIds);
  console.log(metrics);
  res.status(metrics.error === null ? 200 : 500).json(metrics);
}
