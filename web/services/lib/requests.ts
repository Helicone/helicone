import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import { getPagination } from "../../components/shared/getPagination";
import { Column } from "../../components/ThemedTableV2";
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
  timeFilter: string | null,
  advancedFilter?: {
    idx: number;
    type?: "number" | "text" | "datetime-local" | undefined;
    supabaseKey?: string | undefined;
    value?: string | undefined;
    column?: Column | undefined;
    operator?: "eq" | "gt" | "lt";
  }[]
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
  if (timeFilter === "Last Hour") {
    date = new Date(date.getTime() - 60 * 60 * 1000);
    query = query.gte("request_created_at", date.toISOString());
  }
  if (timeFilter === "Today") {
    date = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    query = query.gte("request_created_at", date.toISOString());
  }
  if (timeFilter === "7D") {
    date = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
    query = query.gte("request_created_at", date.toISOString());
  }
  if (timeFilter === "1M") {
    date = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
    query = query.gte("request_created_at", date.toISOString());
  }
  if (timeFilter === "3M") {
    date = new Date(date.getTime() - 90 * 24 * 60 * 60 * 1000);
    query = query.gte("request_created_at", date.toISOString());
  }

  if (advancedFilter) {
    advancedFilter.forEach((filter) => {
      if (filter.type === "text") {
        if (filter.operator === "eq") {
          query = query.textSearch(
            filter.supabaseKey as string,
            filter.value as string
          );
        } else {
          // do nothing for gt and lt
        }
      } else if (filter.type === "number") {
        if (filter.operator === "eq") {
          query = query.eq(
            filter.supabaseKey as string,
            parseInt(filter.value as string, 10)
          );
        } else if (filter.operator === "gt") {
          query = query.gt(
            filter.supabaseKey as string,
            parseInt(filter.value as string, 10)
          );
        } else if (filter.operator === "lt") {
          query = query.lt(
            filter.supabaseKey as string,
            parseInt(filter.value as string, 10)
          );
        }
      } else if (filter.type === "datetime-local") {
        if (filter.operator === "eq") {
          query = query.eq(
            filter.supabaseKey as string,
            new Date(filter.value as string).toISOString()
          );
        } else if (filter.operator === "gt") {
          query = query.gt(
            filter.supabaseKey as string,
            new Date(filter.value as string).toISOString()
          );
        } else if (filter.operator === "lt") {
          query = query.lt(
            filter.supabaseKey as string,
            new Date(filter.value as string).toISOString()
          );
        }
      }
    });
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  return { data, error, count, from, to };
};

export { getRequests };
