import { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseServer } from "../../../../lib/supabaseServer";

export type Tier = "free" | "pro" | "growth" | "enterprise";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ orgId?: string; error?: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = req.query.id as string;
  const isEu = req.body.isEu;

  // First, try to find existing demo org
  const { data: existingDemoOrg } = await getSupabaseServer()
    .from("organization")
    .select("*")
    .eq("soft_delete", false)
    .eq("owner", userId)
    .eq("tier", "demo")
    .single();

  if (existingDemoOrg) {
    return res.status(201).json({ orgId: existingDemoOrg.id });
  }

  // If no demo org exists, create one with upsert

  // Add member record
  const result = await getSupabaseServer()
    .rpc("ensure_one_demo_org", {
      user_id: userId,
    })
    .single();

  if (result.error) {
    console.error(result.error);
    return res.status(500).json({ error: result.error.message });
  }

  // Add member record
  const { error: memberError } = await getSupabaseServer()
    .from("organization_member")
    .upsert(
      {
        created_at: new Date().toISOString(),
        member: userId,
        organization: result.data.organization_id,
        org_role: "owner",
      },
      {
        onConflict: "member,organization",
        ignoreDuplicates: true,
      }
    );

  if (memberError) {
    return res.status(500).json({ error: memberError.message });
  }

  return res.status(200).json({ orgId: result.data.organization_id });
}
