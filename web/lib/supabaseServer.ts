import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../supabase/database.types";

export const getSupabaseUrl = (): string => {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (url === "") {
    throw new Error(`SUPABASE_URL is not set`);
  }
  return url;
};

export const getSupabaseServiceKey = (): string => {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY ?? "";
  if (serviceKey === "") {
    throw new Error(`SUPABASE_SERVICE_KEY is not set`);
  }
  return serviceKey;
};

export class SupabaseServerSingleton {
  private static instance: SupabaseClient<Database>;

  private constructor() {}

  public static getInstance(): SupabaseClient<Database> {
    if (!this.instance) {
      const supabaseUrl = getSupabaseUrl();
      const supabaseServiceKey = getSupabaseServiceKey();

      this.instance = createClient<Database>(supabaseUrl, supabaseServiceKey);
    }
    return this.instance;
  }
}

export const supabaseServer = () => SupabaseServerSingleton.getInstance();
