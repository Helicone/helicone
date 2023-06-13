import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../supabase/database.types";
import { getRequestCountClickhouse } from "./api/request/request";

export async function requestOverLimit(
  client: SupabaseClient<Database>,
  orgId: string
) {
  try {
    const startOfThisMonth = new Date();
    startOfThisMonth.setDate(1);
    startOfThisMonth.setHours(0);
    startOfThisMonth.setMinutes(0);
    startOfThisMonth.setSeconds(0);
    startOfThisMonth.setMilliseconds(0);

    const [
      { data: count, error },
      { data: userSettings, error: userSettingsError },
    ] = await Promise.all([
      await getRequestCountClickhouse(orgId, {
        response_copy_v3: {
          request_created_at: {
            gte: startOfThisMonth,
          },
        },
      }),
      client.from("user_settings").select("*").single(),
    ]);

    if (userSettingsError !== null || userSettings === null) {
      return false;
    }
    if (error !== null || count === null) {
      return false;
    }
    if (userSettings.tier === "basic_flex") {
      return false;
    }
    return count > userSettings.request_limit;
  } catch (e) {
    return false;
  }
}
