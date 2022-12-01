import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY ?? "";

if (supabaseUrl === "" || supabaseServiceKey === "") {
  throw new Error(`URL or Anon ENV not set for Server - ${supabaseServiceKey}`);
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);
