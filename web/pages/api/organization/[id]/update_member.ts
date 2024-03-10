import { supabaseServer } from "./../../../../lib/supabaseServer";
import { NextApiRequest, NextApiResponse } from "next";
import { Result } from "../../../../lib/result";
import { SupabaseServerWrapper } from "../../../../lib/wrappers/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<null, string>>
) {
  const client = new SupabaseServerWrapper({ req, res }).getClient();
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const { id } = req.query;

  const { orgRole, memberId } = req.body as {
    orgRole: string;
    memberId: string;
  };

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

  const { data: orgMember } = await supabaseServer()
    .from("organization_member")
    .select("*")
    .eq("member", user.data.user.id)
    .eq("organization", id as string)
    .single();

  // check if the user is an admin role OR the owner
  const isAdmin = orgMember !== null && orgMember.org_role === "admin";
  const isOwner = orgAccess.data.owner === user.data.user.id;

  if (!isAdmin && !isOwner) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }

  const { error } = await supabaseServer()
    .from("organization_member")
    .update({
      org_role: orgRole,
    })
    .match({ member: memberId, organization: id })
    .select("*");

  if (error !== null) {
    console.error("Error", error);
    res.status(500).json({ error: error.code, data: null });
    return;
  }
  res.status(200).json({ error: null, data: null });
}
