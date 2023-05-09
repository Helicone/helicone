import { getRequestCount } from "../../../lib/api/request/request";

import { SupabaseClient } from "@supabase/supabase-js";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { Database } from "../../../supabase/database.types";

async function checkAndUpdateOrgs(
  orgs: Database["public"]["Tables"]["organization"]["Row"][],
  supabaseClient: SupabaseClient<Database>
): Promise<boolean> {
  for (const org of orgs) {
    const count = (await getRequestCount(org.id, "all")).data ?? 0;
    if (count > 0) {
      await supabaseClient
        .from("organization")
        .update({ has_onboarded: true })
        .eq("id", org.id);
      return true;
    }
  }
  return false;
}

export async function checkOnboardedAndUpdate(
  supabaseClient: SupabaseClient<Database>
): Promise<Result<boolean, string>> {
  const { data: orgs, error: orgsError } = await supabaseClient
    .from("organization")
    .select("*");
  if (orgsError !== null) {
    return { error: orgsError.message, data: null };
  }

  const onboardedOrg = orgs.find((org) => org.has_onboarded);
  if (onboardedOrg !== undefined) {
    return { error: null, data: true };
  } else {
    return {
      error: null,
      data: await checkAndUpdateOrgs(orgs, supabaseClient),
    };
  }
}
async function handler({
  res,
  supabaseClient,
}: HandlerWrapperOptions<Result<boolean, string>>) {
  const { data, error } = await checkOnboardedAndUpdate(
    supabaseClient.getClient()
  );
  if (error !== null) {
    res.status(500).json({ error, data: null });
  } else {
    res.status(200).json({ error: null, data });
  }
}

export default withAuth(handler);
