// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { Value, getPromptValues } from "../../../lib/api/prompts/prompts";
import { Result } from "../../../lib/result";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<Value[], string>>
) {
  const client = new SupabaseServerWrapper({ req, res }).getClient();
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const values = await getPromptValues(user.data.user.id);
  res.status(values.error === null ? 200 : 500).json(values);
}
