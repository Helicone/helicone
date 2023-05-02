// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { Database } from "../../supabase/database.types";
import { getRequests } from "../../lib/api/request/request";
import { Result } from "../../lib/result";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<boolean, string>>
) {
  const client = createServerSupabaseClient<Database>({ req, res });
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }

  const requests = await getRequests(user.data.user.id, "all", 0, 1, {
    created_at: "asc",
  });

  if (requests.error !== null) {
    res.status(500).json({ error: requests.error, data: null });
    return;
  }
  return res.status(200).json({
    error: null,
    data: requests.data.length > 0 && requests.data[0].helicone_user !== null,
  });
}
