import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../supabase/database.types";

class SupabaseSingleton {
  private static instance: SupabaseClient<Database>;
  private static supabaseUrl: string =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  private static supabaseServiceKey: string =
    process.env.SUPABASE_SERVICE_KEY ?? "n/a";

  private constructor() {}

  public static getInstance(): SupabaseClient<Database> {
    if (!SupabaseSingleton.instance) {
      if (
        SupabaseSingleton.supabaseUrl === "" ||
        SupabaseSingleton.supabaseServiceKey === "n/a"
      ) {
        throw new Error(
          `URL or Service Key ENV not set for Server - ${SupabaseSingleton.supabaseServiceKey}`
        );
      }
      SupabaseSingleton.instance = createClient<Database>(
        SupabaseSingleton.supabaseUrl,
        SupabaseSingleton.supabaseServiceKey
      );
    }
    return SupabaseSingleton.instance;
  }
}

export const supabaseServer = SupabaseSingleton.getInstance();
