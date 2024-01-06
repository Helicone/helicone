import { NextApiRequest, NextApiResponse } from "next";
import { supabaseServer } from "../../../../lib/supabaseServer";

export type Tier = "free" | "pro" | "enterprise";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
  const userId = req.query.id as string;

  const orgs = await supabaseServer
    .from("organization")
    .select("*")
    .eq("soft_delete", false)
    .eq("owner", userId);

  if (!orgs.data || orgs.data.length === 0) {
    const result = await supabaseServer.from("organization").insert([
      {
        name: "My Organization",
        owner: userId,
        tier: "free",
        is_personal: true,
      },
    ]);
    if (result.error) {
      res.status(500).json(result.error.message);
      return;
    }
  }
  res.status(200).json("Added successfully");
}
