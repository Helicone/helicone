import { SupabaseClient } from "@supabase/supabase-js";
import { UserSettingsResponse } from "../pages/api/user_settings";
import { Database } from "../supabase/database.types";

export async function requestOverLimit(client: SupabaseClient<Database>) {
  const startOfThisMonth = new Date();
  startOfThisMonth.setDate(1);
  startOfThisMonth.setHours(0);
  startOfThisMonth.setMinutes(0);
  startOfThisMonth.setSeconds(0);
  startOfThisMonth.setMilliseconds(0);
  const [{ count, error }, { data: userSettings, error: userSettingsError }] =
    await Promise.all([
      client
        .from("request_rbac")
        .select("*", { count: "exact" })
        .gte("created_at", startOfThisMonth.toISOString()),
      client.from("user_settings").select("*").single(),
    ]);

  if (userSettingsError !== null || userSettings === null) {
    throw new Error("Failed to get user settings");
  }
  if (error !== null || count === null) {
    throw new Error("Failed to get request count");
  }

  return count > userSettings.request_limit;
}
