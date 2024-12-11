import { NextApiRequest, NextApiResponse } from "next";
import { supabaseServer } from "../../../../lib/supabaseServer";

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
  const { data: existingDemoOrg } = await supabaseServer
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
  const result = await supabaseServer
    .from("organization")
    .upsert(
      {
        name: "Demo Org",
        owner: userId,
        tier: "demo",
        is_personal: true,
        has_onboarded: true,
        soft_delete: false,
      },
      {
        onConflict: "owner,tier",
        ignoreDuplicates: true,
      }
    )
    .select("*")
    .single();

  if (result.error) {
    console.error(result.error);
    return res.status(500).json({ error: result.error.message });
  }

  // Add member record
  const { error: memberError } = await supabaseServer
    .from("organization_member")
    .upsert(
      {
        created_at: new Date().toISOString(),
        member: userId,
        organization: result.data.id,
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

  return res.status(200).json({ orgId: result.data.id });
}
