import { NextApiRequest, NextApiResponse } from "next";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";

export enum Provider {
  OPENAI = "OpenAI",
  ANTHROPIC = "ANTHROPIC",
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = new SupabaseServerWrapper({ req, res }).getClient();
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }

  const org = await client.from("organization_member").select(`*`).eq("id", user.data.user.id).single();

  if (org.error !== null || org.data === null) {
    console.error("Failed to retrieve organization", org.error);
    res.status(500).json({ error: org.error.message, data: null });
    return;
  }

  const keys = await client.from("decrypted_provider_keys").select("*").eq("org_id", org.data.organization).single();

  if (keys.error !== null || keys.data === null) {
    console.log("Failed to retrieve proxy keys");
    res.status(500).json({ error: keys.error.message, data: null });
    return;
  }

  res.status(200).json({ error: null, data: keys.data });
}
