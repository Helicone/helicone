import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { checkAccessToMutateOrg } from "../../../lib/api/organization/hasAccess";
import { Result } from "../../../lib/result";
import { supabaseServer } from "../../../lib/supabaseServer";
import { Database } from "../../../supabase/database.types";

async function handler({
  res,
  userData: { orgId, user, userId, org },
  body,
}: HandlerWrapperOptions<Result<string, string>>) {
  if (!user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  if (!org) {
    res.status(500).json({ error: "Organization not found", data: null });
    return;
  }

  const hasAccess = await checkAccessToMutateOrg(orgId as string, userId);

  if (hasAccess) {
    const updateRequest =
      body.get<Database["public"]["Tables"]["organization_layout"]["Update"]>();

    const updateRes = await supabaseServer
      .from("organization_layout")
      .update({
        filters: updateRequest.filters,
      })
      .eq("id", orgId)
      .eq("type", updateRequest.type);

    if (updateRes.error) {
      res
        .status(500)
        .json({ error: "internal error" + updateRes.error, data: null });
    } else {
      res.status(200).json({ error: null, data: "success" });
    }
  } else {
    console.error("No access to org", orgId, user, userId);
    res
      .status(404)
      .json({ error: "Not found or don't have access to org", data: null });
  }
}

export default withAuth(handler);
