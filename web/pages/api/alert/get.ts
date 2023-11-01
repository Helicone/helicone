import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { supabaseServer } from "../../../lib/supabaseServer";
import { Database } from "../../../supabase/database.types";
import { validateAlertCreate } from "../../../services/lib/alert";
import { Permission } from "../../../services/lib/user";

async function handler({
  req,
  res,
  userData,
}: HandlerWrapperOptions<
  Result<Database["public"]["Tables"]["alert"]["Row"][], string>
>) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed", data: null });
  }

  const { data: alerts, error: alertsError } = await supabaseServer
    .from("alert")
    .select("*")
    .eq("org_id", userData.orgId);

  if (alertsError) {
    res.status(500).json({ error: alertsError.message, data: null });
    return;
  }

  res.status(200).json({ error: null, data: alerts });
}

export default withAuth(handler, [Permission.MANAGE_KEYS]);
