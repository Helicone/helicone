import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import { Result } from "../../../../lib/result";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { Database } from "../../../../supabase/database.types";

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
  const client = createServerSupabaseClient<Database>({ req, res });
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

  const orgAccess = await client
    .from("organization")
    .select("*")
    .eq("id", id as string)
    .single();

  if (orgAccess.error !== null || orgAccess.data === null) {
    console.error("Error", orgAccess.error);
    res.status(500).json({ error: orgAccess.error.message, data: null });
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
