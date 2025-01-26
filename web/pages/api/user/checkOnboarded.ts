import { getRequestCountClickhouse } from "../../../lib/api/request/request";

import { getSupabaseServer } from "../../../lib/supabaseServer";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";

async function checkAndUpdateOrgs(orgId: string): Promise<boolean> {
  const count = (await getRequestCountClickhouse(orgId, "all")).data ?? 0;
  if (count > 0) {
    const { error } = await getSupabaseServer()
      .from("organization")
      .update({ has_onboarded: true })
      .eq("id", orgId);
    if (error) {
      console.error("Error updating org", error);
      return false;
    }
    console.log("Updated org", orgId);
    return true;
  }
  return false;
}

async function handler({
  res,
  userData: { orgHasOnboarded, orgId },
}: HandlerWrapperOptions<Result<boolean, string>>) {
  if (orgHasOnboarded) {
    res.status(200).json({ error: null, data: true });
    return;
  }
  const data = await checkAndUpdateOrgs(orgId);
  if (data) {
    res.status(200).json({ error: null, data });
  } else {
    res.status(500).json({ error: "Not Updated", data: null });
  }
}

export default withAuth(handler);
