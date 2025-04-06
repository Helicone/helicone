// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../packages/common/result";
import { getSupabaseServer } from "../../../lib/supabaseServer";

export type Tier = "free" | "pro" | "growth" | "enterprise";

async function handler({
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<Tier, string>>) {
  const { data: org, error: orgError } = await getSupabaseServer()
    .from("organization")
    .select("*")
    .eq("id", orgId)
    .single();

  const { data: orgOwnerSettings, error: userSettingsError } =
    await getSupabaseServer()
      .from("user_settings")
      .select("*")
      .eq("user", org?.owner || "")
      .single();

  if (orgError !== null || userSettingsError !== null) {
    res.status(400).json({
      error: `{orgError: ${orgError}, userSettingsError: ${userSettingsError}}`,
      data: null,
    });
  } else {
    res.status(200).json({
      data: orgOwnerSettings.tier as Tier,
      error: null,
    });
  }
}

export default withAuth(handler);
