import { SupabaseClient } from "@supabase/supabase-js";
import { UserSettingsResponse } from "../pages/api/user_settings";
import { Database } from "../supabase/database.types";
import {
  getRequestCount,
  getRequestCountClickhouse,
} from "./api/request/request";

export async function requestOverLimit(client: SupabaseClient<Database>) {
  try {
    const startOfThisMonth = new Date();
    startOfThisMonth.setDate(1);
    startOfThisMonth.setHours(0);
    startOfThisMonth.setMinutes(0);
    startOfThisMonth.setSeconds(0);
    startOfThisMonth.setMilliseconds(0);
    const userId = (await client.auth.getUser()).data.user?.id;
    if (!userId) {
      return false;
    }

    const [
      { data: count, error },
      { data: userSettings, error: userSettingsError },
    ] = await Promise.all([
      await getRequestCountClickhouse(userId, {
        response_copy_v1: {
          request_created_at: {
            gte: startOfThisMonth.toISOString(),
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
