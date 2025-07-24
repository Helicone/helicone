import { dbExecute } from "@/lib/api/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../../lib/api/handlerWrappers";
import { Result } from "@/packages/common/result";
import { Permission } from "../../../../services/lib/user";

async function handler({
  req,
  res,
  userData,
}: HandlerWrapperOptions<Result<null, string>>) {
  if (req.method !== "DELETE") {
    res.status(405).json({ error: "Method not allowed", data: null });
  }

  const { id } = req.query;

  if (id === undefined || typeof id !== "string") {
    res.status(500).json({ error: "Invalid proxy key mapping id", data: null });
    return;
  }

  const { error } = await dbExecute(
    `UPDATE helicone_proxy_keys SET soft_delete = true WHERE org_id = $1 AND id = $2`,
    [userData.orgId, id],
  );

  if (error) {
    res.status(500).json({ error: error, data: null });
    return;
  }

  res.status(200).json({ error: null, data: null });
}

export default withAuth(handler, [Permission.MANAGE_KEYS]);
