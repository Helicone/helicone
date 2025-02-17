import type { NextApiRequest, NextApiResponse } from "next";
import { SupabaseServerWrapper } from "@/lib/wrappers/supabase";
import { getSupabaseServer } from "@/lib/supabaseServer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabaseClient = new SupabaseServerWrapper({ req, res });

  const userAndOrg = await supabaseClient.getUserAndOrg();
  const client = supabaseClient.getClient();
  const { data: session } = await client.auth.getSession();

  const orgs = await client
    .from("organization")
    .select("*")
    .eq("owner", userAndOrg.data?.user.id ?? "");

  const orgsServer = await getSupabaseServer()
    .from("organization")
    .select("*")
    .eq("owner", userAndOrg.data?.user.id ?? "");

  const orgFromCookie = supabaseClient.orgFromCookie();

  const user = client.auth.getUser();
  return res.status(200).json({
    userAndOrg,
    session: session,
    user: user,
    orgs: orgs,
    orgFromCookie: orgFromCookie,
    orgsServer: orgsServer,
  });
}
