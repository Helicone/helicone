// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {
  getRequestCount,
  getRequestCountClickhouse,
} from "../../../../lib/shared/request/request";

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../../lib/api/handlerWrappers";
import { Result } from "../../../../lib/shared/result";
import { FilterNode } from "../../../../lib/shared/filters/filterDefs";

async function handler({
  req,
  res,
  supabaseClient,
  userData: { orgId },
}: HandlerWrapperOptions<Result<number, string>>) {
  const { filter, organization_id } = req.body as {
    filter: FilterNode;
    organization_id: string;
  };

  const { data: org, error: orgError } = await supabaseClient
    .getClient()
    .from("organization")
    .select("*")
    .eq("id", organization_id || orgId);

  if (orgError !== null || !org || org.length === 0) {
    res.status(400).json({ error: "Invalid org", data: null });
    return;
  }

  const count = await getRequestCountClickhouse(org[0].id, filter);
  res.status(count.error === null ? 200 : 500).json(count);
}

export default withAuth(handler);
