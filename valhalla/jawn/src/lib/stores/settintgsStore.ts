import { cacheResultCustom } from "../../utils/cacheResult";
import { KVCache } from "../cache/kvCache";
import { supabaseServer } from "../db/supabase";
import { ok, Result } from "../shared/result";
import { err } from "../shared/result";

const kvCache = new KVCache(60 * 1000); // 5 minutes

export async function getHeliconeSetting(
  settingName: string
): Promise<Result<string, string>> {
  return await cacheResultCustom(
    "getHeliconeSetting" + settingName,
    async () => {
      const result = await supabaseServer.client
        .from("helicone_settings")
        .select("*")
        .eq("name", settingName)
        .single();
      if (result.error) {
        return err(result.error.message);
      }
      return ok(result.data?.settings?.toString() ?? "");
    },
    kvCache
  );
}
