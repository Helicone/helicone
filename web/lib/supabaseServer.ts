import { createClient } from "@supabase/supabase-js";
import { Database } from "../supabase/database.types";

export const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY ?? "n/a";

export const getSupabaseServer = () =>
  createClient<Database>(supabaseUrl, supabaseServiceKey);
