import { dbExecute } from "@/lib/api/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../../lib/api/handlerWrappers";
import { getRequestCountClickhouse } from "../../../../lib/api/request/request";
import { Result } from "../../../../lib/result";
import { FilterNode } from "../../../../services/lib/filters/filterDefs";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<number, string>>) {
  const { filter, organization_id } = req.body as {
    filter: FilterNode;
    organization_id: string;
  };

  const { data: org, error: orgError } = await dbExecute<{
    id: string;
  }>("SELECT id FROM organization WHERE id = $1", [organization_id || orgId]);

  if (orgError !== null || !org || org.length === 0) {
    res.status(400).json({ error: "Invalid org", data: null });
    return;
  }

  const count = await getRequestCountClickhouse(org[0].id, filter);
  res.status(count.error === null ? 200 : 500).json(count);
}

export default withAuth(handler);
