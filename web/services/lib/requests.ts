import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import { getPagination } from "../../components/shared/getPagination";
import { Database } from "../../supabase/database.types";

export type ResponseAndRequest = Omit<
  Database["public"]["Views"]["response_and_request_rbac"]["Row"],
  "response_body" | "request_body"
> & {
  response_body: {
    choices:
      | {
          text: string;
          logprobs: {
            token_logprobs: number[];
          };
        }[]
      | null;
    usage:
      | {
          total_tokens: number;
        }
      | null
      | undefined;
    model: string;
    error?: any;
  } | null;
  request_body: {
    prompt: string;
    max_tokens: number;
    model: string;
    temperature: number;
  } | null;
};

const getRequests = async (
  client: SupabaseClient<any, "public", any>,
  currentPage: number,
  pageSize: number,
  sortBy: string
) => {
  const { from, to } = getPagination(currentPage - 1, pageSize);

  let query = client
    .from("response_and_request_rbac")
    .select("*", { count: "exact" });

  if (sortBy === "request_time_desc") {
    query = query.order("request_created_at", { ascending: false });
  }
  if (sortBy === "request_time_asc") {
    query = query.order("request_created_at", { ascending: true });
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  return { data, error, count, from, to };
};

export { getRequests };
