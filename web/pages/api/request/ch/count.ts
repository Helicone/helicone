// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {
  getRequestCount,
  getRequestCountClickhouse,
} from "../../../../lib/api/request/request";

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../../lib/api/handlerWrappers";
import { Result } from "../../../../lib/result";
import { FilterNode } from "../../../../services/lib/filters/filterDefs";

async function handler({
  req,
  res,
  supabaseClient,
}: HandlerWrapperOptions<Result<number, string>>) {
  console.log(1);
  const { org_id: orgId } = req.query as {
    org_id: string;
  };

  console.log("orgId", orgId);

  const { filter } = req.body as {
    filter: FilterNode;
  };

  const { data: org, error: orgError } = await supabaseClient
    .getClient()
    .from("organization")
    .select("*")
    .eq("id", orgId);

  if (orgError !== null || !org || org.length === 0) {
    res.status(400).json({ error: "Invalid org", data: null });
    return;
  }

  const count = await getRequestCountClickhouse(orgId, {});
  res.status(count.error === null ? 200 : 500).json(count);
}

export default withAuth(handler);
