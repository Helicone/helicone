import { Result } from "../../../../lib/result";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../../lib/api/handlerWrappers";
import { Permission } from "../../../../services/lib/user";
import { supabaseServer } from "../../../../lib/supabaseServer";

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

  const { error } = await supabaseServer
    .from("provider_keys")
    .update({ soft_delete: true })
    .eq("org_id", userData.orgId)
    .eq("id", id);

  if (error) {
    res.status(500).json({ error: error.message, data: null });
    return;
  }

  res.status(200).json({ error: null, data: null });
}

export default withAuth(handler, [Permission.MANAGE_KEYS]);
