import type { NextApiRequest, NextApiResponse } from "next";
import { getSSRHeliconeAuthClient } from "@/packages/common/auth/client/getSSRHeliconeAuthClient";
import { SUPABASE_AUTH_TOKEN } from "@/lib/constants";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const auth = await getSSRHeliconeAuthClient({ ctx: { req, res } });
  const org = await auth.getOrg();
  if (org.error || !org.data) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE || "http://localhost:8585";

    // Extract Supabase access token from cookie (server-side)
    const rawCookie = req.cookies[SUPABASE_AUTH_TOKEN];
    let jwt: string | undefined;
    try {
      jwt = rawCookie ? JSON.parse(decodeURIComponent(rawCookie))?.[0] : undefined;
    } catch (_) {
      jwt = undefined;
    }
    if (!jwt) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const heliconeAuthHeader = JSON.stringify({
      _type: "jwt",
      token: jwt,
      orgId: org.data.org.id,
    });

    const response = await fetch(`${baseUrl}/v1/share/screenshot`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "helicone-authorization": heliconeAuthHeader,
      },
      body: JSON.stringify(req.body),
    });
    const json = await response.json();
    if (!response.ok) {
      res.status(response.status).json(json);
      return;
    }
    res.status(201).json(json);
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message ?? e) });
  }
}


