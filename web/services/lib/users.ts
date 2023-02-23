import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import { getPagination } from "../../components/shared/getPagination";

export interface UserRow {
  user_id: string;
  active_for: string;
  last_active: string;
  total_requests: string;
  average_requests_per_day_active: string;
  average_tokens_per_request: string;
}

const getUsers = async (
  client: SupabaseClient<any, "public", any>,
  currentPage: number,
  pageSize: number,
  textSearch?: {
    column: string;
    value: string;
  }
) => {
  const { from, to } = getPagination(currentPage - 1, pageSize);

  let query = client.from("user_metrics_rbac").select("*", { count: "exact" });

  if (textSearch) {
    query = query.textSearch(textSearch.column, textSearch.value);
  }

  query = query.range(from, to);

  const { data: rawData, error, count } = await query;

  const data =
    rawData?.map((row, i) => {
      return {
        user_id: row.user_id ? row.user_id : "n/a",
        active_for: (
          (new Date().getTime() - new Date(row.first_active).getTime()) /
          (1000 * 3600 * 24)
        ).toFixed(2),
        last_active: new Date(row.last_active).toLocaleString(),
        total_requests: row.total_requests,
        average_requests_per_day_active: (
          +row.total_requests /
          Math.ceil(
            (new Date().getTime() - new Date(row.first_active).getTime()) /
              (1000 * 3600 * 24)
          )
        ).toFixed(2),
        average_tokens_per_request: row.average_tokens_per_request
          ? (+row.average_tokens_per_request).toFixed(2)
          : "n/a",
      };
    }) || [];

  return { data, error, count, from, to };
};

export { getUsers };
