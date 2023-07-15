// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { supabaseServer } from "../../../lib/supabaseServer";

export type Tier = "free" | "pro" | "enterprise";

async function handler({
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<Tier, string>>) {
  const { data: org, error: orgError } = await supabaseServer
    .from("organization")
    .select("*")
    .eq("id", orgId)
    .single();

  const { data: userSettings, error: userSettingsError } = await supabaseServer
    .from("user_settings")
    .select("*")
    .eq("user", org?.owner)
    .single();

  console.log("userSettings", userSettings);
  console.log("org", org);
  if (orgError !== null || userSettingsError !== null) {
    res.status(400).json({
      error: `{orgError: ${orgError}, userSettingsError: ${userSettingsError}}`,
      data: null,
    });
  } else {
    res.status(200).json({
      data: userSettings.tier as Tier,
      error: null,
    });
  }
}

export default withAuth(handler);
