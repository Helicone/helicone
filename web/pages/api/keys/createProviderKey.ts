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

  const { providerName, providerKey, providerKeyName } = req.query;

  if (providerName === undefined || typeof providerName !== "string") {
    res.status(500).json({ error: "Invalid providerName", data: null });
    return;
  }
  if (providerKey === undefined || typeof providerKey !== "string") {
    res.status(500).json({ error: "Invalid providerKey", data: null });
    return;
  }
  if (providerKeyName === undefined || typeof providerKeyName !== "string") {
    res.status(500).json({ error: "Invalid providerKeyName", data: null });
    return;
  }

  const org = await client.from("organization_member").select(`*`).eq("id", user.data.user.id).single();

  if (org.error !== null || org.data === null) {
    console.error("Error", org.error);
    res.status(500).json({ error: org.error.message, data: null });
    return;
  }

  const { error } = await client.from("provider_keys").insert({
    org_id: org.data.organization,
    provider_name: providerName,
    provider_key: providerKey,
    provider_key_name: providerKeyName,
  });

  if (error) {
    console.log("Failed to insert proxy key");
    res.status(500).json({ error: error.message, data: null });
    return;
  }

  res.status(200).json({ error: null, data: null });
}
