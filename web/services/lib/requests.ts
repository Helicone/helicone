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
  pageSize: number
) => {
  const { from, to } = getPagination(currentPage - 1, pageSize);

  const { data, error, count } = await client
    .from("response_and_request_rbac")
    .select("*", { count: "exact" })
    .order("request_created_at", { ascending: false })
    .range(from, to);

  return { data, error, count, from, to };
};

export { getRequests };
