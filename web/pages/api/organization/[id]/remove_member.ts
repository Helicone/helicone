import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import { dbExecute } from "../../../../lib/api/db/dbExecute";
import { Result } from "../../../../lib/result";
import { supabaseServer } from "../../../../lib/supabaseServer";

// export async function deleteUserIdFromOrg(userId: String) {
//   const query = `
//     select id from auth.users where email = $1 limit 1
//   `;
//   return await dbExecute<{
//     id: string;
//   }>(query, [userId]);
// }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<null, string>>
) {
  const client = createServerSupabaseClient({ req, res });
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const { memberId, id } = req.query;

  if (memberId === undefined) {
    res.status(500).json({ error: "Invalid MemberId", data: null });
    return;
  }
  if (id === undefined) {
    res.status(500).json({ error: "Invalid OrgId", data: null });
    return;
  }
  const { error: deleteError } = await supabaseServer
    .from("organization_member")
    .delete()
    .eq("member", memberId as string)
    .eq("organization", id as string);

  if (deleteError !== null) {
    console.error("Error", deleteError);
    res.status(500).json({ error: deleteError.message, data: null });
    return;
  }
  res.status(200).json({ error: null, data: null });
}
