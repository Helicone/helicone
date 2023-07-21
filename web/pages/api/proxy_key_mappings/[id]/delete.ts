import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../../lib/api/handlerWrappers";
import { Permission } from "../../../../services/lib/user";
import { Result } from "../../../../lib/result";
import { supabaseServer } from "../../../../lib/supabaseServer";

async function handler({
  req,
  res,
  supabaseClient,
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

  const { error } = await supabaseServer
    .from("proxy_key_mappings")
    .delete()
    .eq("org_id", userData.orgId)
    .eq("id", id);

  if (error) {
    console.log("Failed to delete proxy key mapping");
    res.status(500).json({ error: error.message, data: null });
    return;
  }

  res.status(200).json({ error: null, data: null });
}

export default withAuth(handler, [Permission.MANAGE_KEYS]);
