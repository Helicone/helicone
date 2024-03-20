import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { mapPostgrestErr, Result } from "../../../lib/result";
import { supabaseServer } from "../../../lib/supabaseServer";
import { Database } from "../../../supabase/database.types";

//todo: do we need to create layout when create a org or separately? create org or create filter?

export type Org;

async function handler({
  res,
  userData: { orgId, user, userId, org },
  body,
}: HandlerWrapperOptions<
  Result<Database["public"]["Tables"]["organization_layout"]["Row"], string>
>) {
  if (!user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  if (!org) {
    res.status(500).json({ error: "Organization not found", data: null });
    return;
  }

  const insertRequest =
    body.get<Database["public"]["Tables"]["organization_layout"]["Insert"]>();

  const insert = await supabaseServer
    .from("organization_layout")
    .insert([insertRequest])
    .select("*")
    .single();

  return res.status(insert.error ? 500 : 200).json(mapPostgrestErr(insert));

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
    const filtersArr = layout.filters as unknown as OrganizationFilter[];

    const orgLayout: OrganizationLayout = {
      id: layout.id,
      organization_id: layout.organization_id,
      type: layout.type,
      filters: filtersArr,
    };

    res.status(200).json({
      data: orgLayout,
      error: null,
    });
  }
}

export default withAuth(handler);
