import { createClient } from "@supabase/supabase-js";
import { Database } from "../supabase/database.types";

export const getSupabaseUrl = () => {
  return process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
};
export const getSupabaseServer = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY ?? "";

  if (getSupabaseUrl() === "" || supabaseServiceKey === "") {
    throw new Error(
      `URL or Anon ENV not set for Server - ${supabaseServiceKey}`
    );
  }
  return createClient<Database>(getSupabaseUrl(), supabaseServiceKey);
};
