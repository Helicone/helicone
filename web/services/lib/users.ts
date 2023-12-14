import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import { getPagination } from "../../components/shared/getPagination";
import { Column } from "../../components/ThemedTableV2";

export interface UserRow {
  user_id: string;
  active_for: string;
  last_active: string;
  total_requests: string;
  average_requests_per_day_active: string;
  average_tokens_per_request: string;
  cost: number;
}

/**
 * Retrieves a paginated list of users from the Supabase database.
 *
 * @param client - The Supabase client instance.
 * @param currentPage - The current page number.
 * @param pageSize - The number of items per page.
 * @param advancedFilter - An optional array of advanced filters to apply to the query.
 * @returns An object containing the paginated user data, error, count, from, and to values.
 */
const getUsers = async (
  client: SupabaseClient<any, "public", any>,
  currentPage: number,
  pageSize: number,
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

  let query = client.from("user_metrics_rbac").select("*", { count: "exact" });

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
