import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { supabaseServer } from "../../../lib/supabaseServer";
import { Database } from "../../../supabase/database.types";

async function handler({
  res,
  userData: { orgId, user, userId },
  req,
}: HandlerWrapperOptions<
  Result<Database["public"]["Tables"]["organization_layout"]["Row"], string>
>) {
  if (!user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const orgToCheck = await supabaseServer
    .from("organization")
    .select("*")
    .eq("id", orgId)
    .single();
  if (!orgToCheck.data || orgToCheck.error !== null) {
    res
      .status(404)
      .json({ error: "Not found or don't have access to org", data: null });
    return;
  }

  const { type } = req.query;

  const { data: layout, error: organizationLayoutError } = await supabaseServer
    .from("organization_layout")
    .select("*")
    .eq("organization_id", orgId)
    .eq("type", type)
    .single();

  if (organizationLayoutError !== null) {
    res.status(400).json({
      error: `{orgError: ${organizationLayoutError} }`,
      data: null,
    });
  } else {
    res.status(200).json({
      data: layout,
      error: null,
    });
  }
}

export default withAuth(handler);
