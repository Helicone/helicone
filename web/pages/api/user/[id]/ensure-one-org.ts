import { NextApiRequest, NextApiResponse } from "next";
import { supabaseServer } from "../../../../lib/supabaseServer";
import generateApiKey from "generate-api-key";

export type Tier = "free" | "pro" | "growth" | "enterprise";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
  if (req.method !== "POST") {
    res.status(405).json("Method not allowed");
    return;
  }
  const heliconeAuthorizationHeader = req.headers["helicone-authorization"];
  const userId = req.query.id as string;
  const isEu = req.body.isEu;

  const orgs = await supabaseServer
    .from("organization")
    .select("*")
    .eq("soft_delete", false)
    .eq("owner", userId);

  if (!orgs.data || orgs.data.length === 0) {
    const result = await supabaseServer
      .from("organization")
      .insert([
        {
          name: "Xpedia AI",
          owner: userId,
          tier: "free",
          is_personal: true,
          has_onboarded: true,
        },
      ])
      .select("*")
      .single();

    if (result.error) {
      res.status(500).json(result.error.message);
    } else {
      const { data: memberInsert, error: memberError } = await supabaseServer
        .from("organization_member")
        .insert({
          created_at: new Date().toISOString(),
          member: userId,
          organization: result.data.id,
          org_role: "owner",
        })
        .select("*");

      const orgId = result.data.id;

      const apiKey = `sk-helicone${isEu ? "-eu" : ""}-${generateApiKey({
        method: "base32",
        dashes: true,
      }).toString()}`.toLowerCase();

      console.log("fetching setup demo");
      console.log(
        process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE,
        heliconeAuthorizationHeader
      );
      await fetch(
        `${process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE}/v1/organization/setup-demo`,
        {
          method: "POST",
          body: JSON.stringify({
            apiKey,
          }),
          headers: {
            "helicone-authorization": heliconeAuthorizationHeader as string,
          },
        }
      );

      res.status(200).json("Added successfully");
    }
  } else {
    res.status(201).json("Already exists");
  }
}
