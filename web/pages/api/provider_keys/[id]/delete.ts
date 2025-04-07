import { dbExecute } from "@/lib/api/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../../lib/api/handlerWrappers";
import { Result } from "../../../../packages/common/result";
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
    res.status(500).json({ error: "Invalid providerKeyId", data: null });
    return;
  }

  const deleteProxyKeys = await dbExecute(
    `UPDATE helicone_proxy_keys SET soft_delete = true WHERE provider_key_id = $1 and org_id = $2`,
    [id, userData.orgId]
  );

  if (deleteProxyKeys.error) {
    res.status(500).json({ error: deleteProxyKeys.error, data: null });
    return;
  }

  res.status(200).json({ error: null, data: null });
}

export default withAuth(handler, [Permission.MANAGE_KEYS]);
