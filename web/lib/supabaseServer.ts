import { createClient } from "@supabase/supabase-js";
import { Database } from "../db/database.types";
import { SecretManager } from "@helicone-package/secrets/SecretManager";

export const supabaseUrl =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  SecretManager.getSecret("SUPABASE_URL") ??
  "";

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY ??
  SecretManager.getSecret("SUPABASE_SERVICE_KEY") ??
  "n/a";

export const getSupabaseServer = () =>
  createClient<Database>(supabaseUrl, supabaseServiceKey);
