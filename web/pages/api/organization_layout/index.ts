import { HandlerWrapperOptions } from "../../../lib/api/handlerWrappers";
import { supabaseServer } from "../../../lib/supabaseServer";

export type OrganizationFilter = {
  id: string;
  name: string;
  filter: string;
  createdAt: Date;
};

export type OrganizationLayout = {
  id: string;
  organization_id: string;
  type: string;
  filters: Array<OrganizationFilter>;
};

async function handler({
  res,
  userData: { orgId, user, userId },
  req,
}: HandlerWrapperOptions<any>) {
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

  const layout = await supabaseServer
    .from("organization_layout")
    .select("*")
    .eq("organization_id", orgId)
    .eq("type", type)
    .single();

  res.status(200).json(layout);
}
