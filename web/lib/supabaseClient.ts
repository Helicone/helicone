import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (supabaseUrl === "" || supabaseAnonKey === "") {
  throw new Error("URL or Anon ENV not set");
}

/**
 * Creates a Supabase client with authentication using the provided authhash.
 * @param authhash - The authentication hash.
 * @returns A Supabase client instance.
 */
export const supabaseClientAuthHash = async (authhash: string) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: true },
    global: {
      headers: {
        authhash,
      },
    },
  });
