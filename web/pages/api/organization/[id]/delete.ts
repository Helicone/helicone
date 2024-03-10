import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../../lib/api/handlerWrappers";
import { checkAccessToMutateOrg } from "../../../../lib/api/organization/hasAccess";
import { Result } from "../../../../lib/result";
import { supabaseServer } from "../../../../lib/supabaseServer";

async function handler({
  res,
  userData: { orgId, user, userId },
  supabaseClient: _,
  req,
}: HandlerWrapperOptions<Result<string, string>>) {
  const { id } = req.query;

  const hasAccess = await checkAccessToMutateOrg(id as string, userId);

  if (hasAccess) {
    const deleteRes = await supabaseServer()
      .from("organization")
      .update({
        soft_delete: true,
      })
      .eq("id", id);

    if (deleteRes.error) {
      res
        .status(500)
        .json({ error: "internal error" + deleteRes.error, data: null });
    } else {
      res.status(200).json({ error: null, data: "success" });
    }
  } else {
    console.error("No access to org", orgId, user, userId);
    res
      .status(404)
      .json({ error: "Not found or don't have access to org", data: null });
  }
}

export default withAuth(handler);
