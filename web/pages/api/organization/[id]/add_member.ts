// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { dbExecute } from "../../../../lib/shared/db/dbExecute";
import { Result } from "../../../../lib/shared/result";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { SupabaseServerWrapper } from "../../../../lib/wrappers/supabase";

export async function getUserId(userEmail: String) {
  const query = `
  select id from auth.users where email = $1 limit 1
`;

  return await dbExecute<{
    id: string;
  }>(query, [userEmail]);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<null, string>>
) {
  // check if this request is a post
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed", data: null });
    return;
  }

  const client = new SupabaseServerWrapper({ req, res }).getClient();
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const { id } = req.query;

  // get the email from the body
  const { email } = req.body;

  let { data: userId, error: userIdError } = await getUserId(email as string);

  if (userIdError !== null) {
    res.status(500).json({ error: userIdError, data: null });
    return;
  }
  if (userId?.length === 0) {
    await supabaseServer.auth.signInWithOtp({
      email: email as string,
    });
    const res = await getUserId(email as string);
    userId = res.data;
    userIdError = res.error;
  }

  if (userIdError !== null) {
    res.status(500).json({ error: userIdError, data: null });
    return;
  }

  const { error: insertError } = await supabaseServer
    .from("organization_member")
    .insert([{ organization: id as string, member: userId![0].id }]);

  if (insertError !== null) {
    console.error("Error", insertError);
    if (insertError.code === "23505") {
      res.status(200).json({ error: "User already added", data: null });
      return;
    }
    res.status(500).json({ error: insertError.message, data: null });
    return;
  }

  res.status(200).json({ error: null, data: null });
}
