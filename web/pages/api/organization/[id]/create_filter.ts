import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../../lib/api/handlerWrappers";
import { mapPostgrestErr, Result } from "../../../../lib/result";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { OrganizationFilter } from "../../../../services/lib/organization_layout/organization_layout";
import { Database } from "../../../../supabase/database.types";

type CreateOrgLayoutBody = {
  filters: OrganizationFilter[];
  type: "dashboard" | "requests";
};

async function handler({
  req,
  res,
  userData: { orgId, user, userId, org },
}: HandlerWrapperOptions<
  Result<Database["public"]["Tables"]["organization_layout"]["Insert"], string>
>) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed", data: null });
    return;
  }

  if (!user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  if (!org) {
    res.status(500).json({ error: "Organization not found", data: null });
    return;
  }

  const { type, filters } = req.body as CreateOrgLayoutBody;

  const insertRequest: Database["public"]["Tables"]["organization_layout"]["Insert"] =
    {
      organization_id: orgId,
      type: type,
      filters: filters,
    };

  const insert = await supabaseServer
    .from("organization_layout")
    .insert([insertRequest])
    .select("*")
    .single();

  return res.status(insert.error ? 500 : 200).json(mapPostgrestErr(insert));
}

export default withAuth(handler);
