import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../packages/common/result";
import { getSupabaseServer } from "../../../lib/supabaseServer";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<any, string>>) {
  let { data: alert, error: alertError } = await getSupabaseServer()
    .from("alert")
    .select("*")
    .eq("org_id", orgId)
    .not("soft_delete", "eq", true);

  let { data: alertHistory, error: alertHistoryError } =
    await getSupabaseServer()
      .from("alert_history")
      .select("*")
      .eq("org_id", orgId)
      .not("soft_delete", "eq", true);

  if (alertError || !alert) {
    res.status(500).json({ error: alertError?.message || "", data: null });
    return;
  }

  if (alertHistoryError || !alertHistory) {
    res
      .status(500)
      .json({ error: alertHistoryError?.message || "", data: null });
    return;
  }

  res.status(200).json({ error: null, data: { alert, alertHistory } });
}

export default withAuth(handler);
