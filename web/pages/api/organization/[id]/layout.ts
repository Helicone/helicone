import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../../lib/api/handlerWrappers";
import { Result } from "../../../../lib/result";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { OrganizationLayout } from "../../../../services/lib/organization_layout/organization_layout";

async function handler({
  res,
  userData: { orgId, user, userId },
  req,
}: HandlerWrapperOptions<Result<OrganizationLayout, string>>) {
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
    const filters = JSON.parse(layout.filters as string);
    const orgLayout: OrganizationLayout = {
      id: layout.id,
      type: layout.type,
      filters: filters,
      organization_id: layout.organization_id,
    };
    res.status(200).json({
      data: orgLayout,
      error: null,
    });
  }
}

export default withAuth(handler);
