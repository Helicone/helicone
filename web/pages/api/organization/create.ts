import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result, mapPostgrestErr } from "../../../lib/result";
import { supabaseServer } from "../../../lib/supabaseServer";
import { Database } from "../../../supabase/database.types";

export type Tier = "free" | "pro" | "enterprise";

async function handler({
  res,
  userData: { userId, org },
  body,
}: HandlerWrapperOptions<
  Result<Database["public"]["Tables"]["organization"]["Row"], string>
>) {
  const insertRequest =
    body.get<Database["public"]["Tables"]["organization"]["Insert"]>();
  if (insertRequest.owner !== userId) {
    res.status(401).json({
      error: "Unauthorized",
      data: null,
    });
    return;
  }
  if (insertRequest.organization_type === "customer") {
    if (org?.organization_type !== "reseller") {
      res.status(401).json({
        error: "Unauthorized - only resellers can create customers",
        data: null,
      });
      return;
    }
  }
  if (insertRequest.tier !== "free") {
    res.status(401).json({
      error: "Unauthorized - only free tier is supported",
      data: null,
    });
    return;
  }

  const insert = await supabaseServer
    .from("organization")
    .insert([insertRequest])
    .select("*")
    .single();

  return res.status(insert.error ? 500 : 200).json(mapPostgrestErr(insert));
}

export default withAuth(handler);
