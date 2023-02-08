import { SupabaseClient } from "@supabase/auth-helpers-nextjs";

const getKeys = async (client: SupabaseClient<any, "public", any>) => {
  const { data, error, count } = await client
    .from("user_api_keys")
    .select("*", { count: "exact" });

  return { data, error, count };
};

export { getKeys };
