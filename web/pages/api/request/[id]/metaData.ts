// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getRequestMetaData,
  RequestMetaData,
} from "../../../../lib/api/request/metadata";
import { Result } from "../../../../lib/result";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<RequestMetaData[], string>>
) {
  const { id: requestId } = req.query;

  const client = createServerSupabaseClient({ req, res });
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const metrics = await getRequestMetaData(
    user.data.user.id,
    requestId as string
  );

  res.status(metrics.error === null ? 200 : 500).json(metrics);
}
