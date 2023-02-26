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
          text: any;
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
  sortBy: string | null,
  timeFilter: string | null
) => {
  const { from, to } = getPagination(currentPage - 1, pageSize);

  let query = client
    .from("response_and_request_rbac")
    .select("*", { count: "exact" });

  let date = new Date();

  if (sortBy === "time_desc" || sortBy === null) {
    query = query.order("request_created_at", { ascending: false });
  }
  if (sortBy === "time_asc") {
    query = query.order("request_created_at", { ascending: true });
  }
  if (timeFilter?.includes("custom:")) {
    const timeRange = timeFilter?.split("custom:")[1].split("_");
    const startTime = timeRange[0];
    const endTime = timeRange[1];

    query = query.gte("request_created_at", startTime);
    query = query.lte("request_created_at", endTime);
  }
  if (timeFilter === "day") {
    date = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    query = query.gte("request_created_at", date.toISOString());
  }
  if (timeFilter === "wk") {
    date = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
    query = query.gte("request_created_at", date.toISOString());
  }
  if (timeFilter === "mo") {
    date = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
    query = query.gte("request_created_at", date.toISOString());
  }
  if (timeFilter === "3mo") {
    date = new Date(date.getTime() - 90 * 24 * 60 * 60 * 1000);
    query = query.gte("request_created_at", date.toISOString());
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  return { data, error, count, from, to };
};

export { getRequests };
