import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { supabaseServer } from "../../../lib/supabaseServer";
import { Database } from "../../../supabase/database.types";
import { validateAlertUpdate } from "../../../services/lib/alert";
import { Permission } from "../../../services/lib/user";

async function handler({
  req,
  res,
  userData,
}: HandlerWrapperOptions<
  Result<Database["public"]["Tables"]["alert"]["Row"], string>
>) {
  if (req.method !== "PUT") {
    res.status(405).json({ error: "Method not allowed", data: null });
  }

  const { alert } = req.body as {
    alert: Database["public"]["Tables"]["alert"]["Update"];
  };

  const { error } = validateAlertUpdate(alert);

  if (error) {
    res.status(500).json({ error: error, data: null });
    return;
  }

  const { data: updatedAlert, error: updateError } = await supabaseServer
    .from("alert")
    .update(alert)
    .match({ id: alert.id, org_id: userData.orgId })
    .select("*")
    .single();

  if (updateError) {
    res.status(500).json({ error: updateError.message, data: null });
    return;
  }

  res.status(200).json({ error: null, data: updatedAlert });
}

export default withAuth(handler, [Permission.MANAGE_KEYS]);
