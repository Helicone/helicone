import { getRequestCountClickhouse } from "../../../lib/api/request/request";

import { SupabaseClient } from "@supabase/supabase-js";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { Database } from "../../../supabase/database.types";

async function checkAndUpdateOrgs(
  orgId: string,
  supabaseClient: SupabaseClient<Database>
): Promise<boolean> {
  const count = (await getRequestCountClickhouse(orgId, "all")).data ?? 0;
  if (count > 0) {
    await supabaseClient
      .from("organization")
      .update({ has_onboarded: true })
      .eq("id", orgId);
    return true;
  }
  return false;
}

async function handler({
  res,
  supabaseClient,
  userData: { orgHasOnboarded, orgId },
}: HandlerWrapperOptions<Result<boolean, string>>) {
  if (orgHasOnboarded) {
    res.status(200).json({ error: null, data: true });
    return;
  }
  const data = await checkAndUpdateOrgs(orgId, supabaseClient.getClient());
  if (data) {
    res.status(200).json({ error: null, data });
  } else {
    res.status(500).json({ error: "Not Updated", data: null });
  }
}

export default withAuth(handler);
