import { createClient } from "@supabase/supabase-js";
import { Database } from "../supabase/database.types";

export const supabaseServerUrl =
  process.env.SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY ?? "";

if (supabaseServerUrl === "" || supabaseServiceKey === "") {
  throw new Error(`URL or Anon ENV not set for Server - ${supabaseServiceKey}`);
}

export const supabaseServer = createClient<Database>(
  supabaseServerUrl,
  supabaseServiceKey
);
