// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { getPromptValues, Value } from "../../../lib/api/prompts/prompts";
import { Result } from "../../../lib/result";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<Value[], string>>
) {
  const client = createServerSupabaseClient({ req, res });
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const values = await getPromptValues(user.data.user.id);
  res.status(values.error === null ? 200 : 500).json(values);
}
