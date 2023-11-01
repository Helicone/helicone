import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../../lib/api/handlerWrappers";
import { Result } from "../../../../lib/result";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { validateAlertDelete } from "../../../../services/lib/alert";
import { Permission } from "../../../../services/lib/user";

async function handler({
  req,
  res,
  userData,
}: HandlerWrapperOptions<Result<null, string>>) {
  if (req.method !== "DELETE") {
    res.status(405).json({ error: "Method not allowed", data: null });
  }

  const { id: alertId } = req.query as { id: string };

  const { error } = validateAlertDelete(alertId);

  if (error) {
    res.status(500).json({ error: error, data: null });
    return;
  }

  const { error: deleteError } = await supabaseServer
    .from("alert")
    .update({ soft_delete: true })
    .match({ id: alertId, org_id: userData.orgId });

  if (deleteError) {
    res.status(500).json({ error: deleteError.message, data: null });
    return;
  }

  res.status(200);
}

export default withAuth(handler, [Permission.MANAGE_KEYS]);
