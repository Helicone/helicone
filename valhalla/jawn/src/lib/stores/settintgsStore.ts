import { cacheResultCustom } from "../../utils/cacheResult";
import { KVCache } from "../cache/kvCache";
import { dbExecute } from "../shared/db/dbExecute";
import { ok, Result } from "../../packages/common/result";
import { err } from "../../packages/common/result";

const kvCache = new KVCache(60 * 1000); // 5 minutes

export async function getHeliconeSetting(
  settingName: string,
): Promise<Result<string, string>> {
  return await cacheResultCustom(
    "getHeliconeSetting" + settingName,
    async () => {
      try {
        const result = await dbExecute<{ settings: any }>(
          `SELECT settings
           FROM helicone_settings
           WHERE name = $1
           LIMIT 1`,
          [settingName],
        );

        if (result.error || !result.data || result.data.length === 0) {
          return err(result.error ?? "Setting not found");
        }

        return ok(result.data[0]?.settings?.toString() ?? "");
      } catch (error) {
        console.error("Error fetching Helicone setting:", error);
        return err(String(error));
      }
    },
    kvCache,
  );
}
