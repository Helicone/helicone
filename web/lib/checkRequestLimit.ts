import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../supabase/database.types";
import { getRequestCountClickhouse } from "./api/request/request";

/**
 * Checks if the request count for a given organization has exceeded the request limit set in the user settings.
 * @param client - The Supabase client.
 * @param orgId - The ID of the organization.
 * @returns A boolean indicating whether the request count is over the limit.
 */
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
