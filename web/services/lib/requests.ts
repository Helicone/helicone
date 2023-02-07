import { SupabaseClient } from "@supabase/auth-helpers-nextjs";

const getRequests = async (
  client: SupabaseClient<any, "public", any>,
  from: number,
  to: number
) => {
  const { data, error, count } = await client
    .from("response_and_request_rbac")
    .select("*", { count: "exact" })
    .order("request_created_at", { ascending: false })
    .range(from, to);

  return { data, error, count };
};

export { getRequests };
