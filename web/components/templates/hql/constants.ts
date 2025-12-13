import { components } from "@/lib/clients/jawnTypes/public";
import { $JAWN_API } from "@/lib/clients/jawn";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";

export const SQL_KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "GROUP BY",
  "ORDER BY",
  "HAVING",
  "JOIN",
  "INNER JOIN",
  "LEFT JOIN",
  "RIGHT JOIN",
  "FULL JOIN",
  "ON",
  "AS",
  "AND",
  "OR",
  "NOT",
  "IN",
  "EXISTS",
  "BETWEEN",
  "LIKE",
  "ILIKE",
  "IS",
  "NULL",
  "DISTINCT",
  "LIMIT",
  "OFFSET",
  "UNION",
  "UNION ALL",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "COUNT",
  "SUM",
  "AVG",
  "MIN",
  "MAX",
  "CAST",
  "COALESCE",
];

export const CLICKHOUSE_KEYWORDS = [
  "FINAL",
  "SAMPLE",
  "PREWHERE",
  "ARRAY JOIN",
  "GLOBAL",
  "uniq",
  "groupArray",
  "arrayJoin",
  "toStartOfHour",
  "toStartOfDay",
  "toStartOfMonth",
  "today",
  "yesterday",
  "now",
  "formatDateTime",
  "toString",
  "toDate",
  "toDateTime",
  "splitByChar",
  "arrayMap",
];

export const ALL_KEYWORDS = [...SQL_KEYWORDS, ...CLICKHOUSE_KEYWORDS];

// Predefined example queries for users to learn from
export interface PredefinedQuery {
  name: string;
  description: string;
  sql: string;
  category: "analytics" | "debugging";
}

export const PREDEFINED_QUERIES: PredefinedQuery[] = [
  {
    name: "Requests by Model",
    description: "Count of requests grouped by model",
    category: "analytics",
    sql: `SELECT
  model,
  COUNT(*) as request_count
FROM request_response_rmt
GROUP BY model
ORDER BY request_count DESC
LIMIT 100`,
  },
  {
    name: "Error Rate by Status",
    description: "Error breakdown by status code",
    category: "analytics",
    sql: `SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM request_response_rmt
GROUP BY status
ORDER BY count DESC`,
  },
  {
    name: "Latency Percentiles",
    description: "P50, P90, P99 latency stats",
    category: "analytics",
    sql: `SELECT
  quantile(0.5)(latency) as p50_ms,
  quantile(0.9)(latency) as p90_ms,
  quantile(0.99)(latency) as p99_ms,
  AVG(latency) as avg_ms
FROM request_response_rmt`,
  },
  {
    name: "Cost by Provider",
    description: "Total cost grouped by provider",
    category: "analytics",
    sql: `SELECT
  provider,
  SUM(cost) as total_cost,
  COUNT(*) as request_count
FROM request_response_rmt
GROUP BY provider
ORDER BY total_cost DESC`,
  },
  {
    name: "Recent Errors",
    description: "Last 100 failed requests",
    category: "debugging",
    sql: `SELECT
  request_created_at,
  model,
  provider,
  status,
  latency
FROM request_response_rmt
WHERE status >= 400
ORDER BY request_created_at DESC
LIMIT 100`,
  },
  {
    name: "Slow Requests",
    description: "Requests with latency > 5 seconds",
    category: "debugging",
    sql: `SELECT
  request_created_at,
  model,
  latency,
  prompt_tokens,
  completion_tokens
FROM request_response_rmt
WHERE latency > 5000
ORDER BY latency DESC
LIMIT 100`,
  },
];

export const getTableNames = (
  schemas: {
    table_name: string;
    columns: components["schemas"]["ClickHouseTableColumn"][];
  }[],
) => Array.from(new Set(schemas?.map((d) => d.table_name) ?? []));

export const getTableNamesSet = (
  schemas: {
    table_name: string;
    columns: components["schemas"]["ClickHouseTableColumn"][];
  }[],
) => new Set(getTableNames(schemas));

export function parseSqlAndFindTableNameAndAliases(sql: string) {
  const regex =
    /\b(?:FROM|JOIN)\s+([^\s.]+(?:\.[^\s.]+)?)\s*(?:AS)?\s*([^\s,]+)?/gi;
  const tables = [];
  while (true) {
    const match = regex.exec(sql);
    if (!match) break;
    const table_name = match[1];
    if (!/\(/.test(table_name)) {
      let alias = match[2] as string | null;
      if (alias && /on|where|inner|left|right|join/.test(alias)) {
        alias = null;
      }
      tables.push({ table_name, alias: alias || table_name });
    }
  }
  return tables;
}

// Helper to extract error message from various response formats
function extractQueryError(data: any): string {
  // Handle openapi-fetch error response: { error: { error: "message" } }
  if (data?.error?.error && typeof data.error.error === "string") {
    return data.error.error;
  }
  // Handle direct error object: { error: "message" }
  if (data?.error && typeof data.error === "string") {
    return data.error;
  }
  // Handle nested data error: { data: { error: "message" } }
  if (data?.data?.error && typeof data.data.error === "string") {
    return data.data.error;
  }
  // Fallback
  return "An unexpected error occurred";
}

// Execute query mutation
export const createExecuteQueryMutation = (
  setResult: React.Dispatch<
    React.SetStateAction<components["schemas"]["ExecuteSqlResponse"]>
  >,
  setQueryError: (error: string | null) => void,
  setQueryLoading: (loading: boolean) => void,
) => {
  return {
    mutationFn: async (sql: string) => {
      setQueryLoading(true);
      const response = await $JAWN_API.POST("/v1/helicone-sql/execute", {
        body: {
          sql: sql,
        },
      });
      return response;
    },
    onSuccess: (data: any) => {
      setQueryLoading(false);
      if (data.error || !data.data?.data) {
        const errorMessage = extractQueryError(data);
        setQueryError(errorMessage);
        setResult({
          rows: [],
          elapsedMilliseconds: 0,
          size: 0,
          rowCount: 0,
        });
      } else {
        setQueryError(null);
        setResult({
          rows: data.data?.data.rows,
          elapsedMilliseconds: data.data?.data.elapsedMilliseconds,
          size: data.data?.data.size,
          rowCount: data.data?.data.rowCount,
        });
      }
    },
    onError: (error: any) => {
      setQueryLoading(false);
      setQueryError(error.message || "An unexpected error occurred");
      setResult({
        rows: [],
        elapsedMilliseconds: 0,
        size: 0,
        rowCount: 0,
      });
    },
  };
};

// Save query mutation
export const useSaveQueryMutation = (
  setCurrentQuery: (query: { id: string | undefined; name: string; sql: string }) => void,
  setNotification: (_message: string, _type: "success" | "error") => void,
) => {
  const queryClient = useQueryClient();
  return {
    mutationFn: async (savedQuery: {
      id?: string;
      name: string;
      sql: string;
    }) => {
      if (savedQuery.id) {
        const response = await $JAWN_API.PUT(
          "/v1/helicone-sql/saved-query/{queryId}",
          {
            params: { path: { queryId: savedQuery.id } },
            body: {
              name: savedQuery.name,
              sql: savedQuery.sql,
            },
          },
        );
        return response;
      } else {
        const response = await $JAWN_API.POST("/v1/helicone-sql/saved-query", {
          body: {
            name: savedQuery.name,
            sql: savedQuery.sql,
          },
        });

        if (response.data?.data) {
          setCurrentQuery({
            id: response.data.data[0].id,
            name: response.data.data[0].name,
            sql: response.data.data[0].sql,
          });
        }

        return response;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["get", "/v1/helicone-sql/saved-queries"],
      });
      setNotification("Successfully saved query", "success");
    },
    onError: (error: any) => {
      setNotification(error.message, "error");
    },
  };
};

// Delete query mutation
export const useDeleteQueryMutation = (
  setNotification: (_message: string, _type: "success" | "error") => void,
) => {
  const queryClient = useQueryClient();
  return {
    mutationFn: async (queryId: string) => {
      const response = await $JAWN_API.DELETE(
        "/v1/helicone-sql/saved-query/{queryId}",
        {
          params: { path: { queryId } },
        },
      );
      return response;
    },
    onSuccess: () => {
      setNotification("Query deleted successfully", "success");
      // Invalidate the queries cache to refresh the list
      queryClient.invalidateQueries({
        queryKey: ["get", "/v1/helicone-sql/saved-queries"],
      });
    },
    onError: (error: Error) => {
      setNotification(error.message, "error");
    },
  };
};

// Bulk delete queries mutation
export const useBulkDeleteQueryMutation = (
  setNotification: (_message: string, _type: "success" | "error") => void,
) => {
  const queryClient = useQueryClient();
  return {
    mutationFn: async (queryIds: string[]) => {
      const response = await $JAWN_API.POST(
        "/v1/helicone-sql/saved-queries/bulk-delete",
        {
          body: { ids: queryIds },
        },
      );
      return response;
    },
    onSuccess: (_data: any, queryIds: string[]) => {
      const count = queryIds.length;
      setNotification(
        `${count} ${count === 1 ? "query" : "queries"} deleted successfully`,
        "success",
      );
      // Invalidate the queries cache to refresh the list
      queryClient.invalidateQueries({
        queryKey: ["get", "/v1/helicone-sql/saved-queries"],
      });
    },
    onError: (error: Error) => {
      setNotification(error.message, "error");
    },
  };
};
