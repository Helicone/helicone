import { components } from "@/lib/clients/jawnTypes/public";
import { $JAWN_API } from "@/lib/clients/jawn";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TableSchema } from "./types";
import { normalizeJawnResponse } from "./utils/normalizeJawnResponse";

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

export const getTableNames = (schemas: TableSchema[]) =>
  Array.from(new Set(schemas?.map((d) => d.table_name) ?? []));

export const getTableNamesSet = (schemas: TableSchema[]) =>
  new Set(getTableNames(schemas));

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

// Execute query mutation
export const createExecuteQueryMutation = (
  setResult: React.Dispatch<
    React.SetStateAction<components["schemas"]["ExecuteSqlResponse"]>
  >,
  setQueryError: (error: string | null) => void,
  setQueryLoading: (loading: boolean) => void,
) => {
  return {
    mutationFn: async (
      sql: string,
    ): Promise<{
      error?: { error: string };
      data?: { data: components["schemas"]["ExecuteSqlResponse"] };
    }> => {
      setQueryLoading(true);
      const response = await $JAWN_API.POST("/v1/helicone-sql/execute", {
        body: {
          sql: sql,
        },
      });
      return normalizeJawnResponse<components["schemas"]["ExecuteSqlResponse"]>(
        response,
      );
    },
    onSuccess: (data: {
      error?: { error: string };
      data?: { data: components["schemas"]["ExecuteSqlResponse"] };
    }) => {
      setQueryLoading(false);
      if (data.error || !data.data?.data) {
        setQueryError(data.error?.error || "Query execution failed");
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
    onError: (error: Error) => {
      setQueryError(error.message);
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
  setCurrentQuery: React.Dispatch<
    React.SetStateAction<{ id: string | undefined; name: string; sql: string }>
  >,
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
        const response = await $JAWN_API.PUT("/v1/helicone-sql/saved-query", {
          body: {
            id: savedQuery.id,
            name: savedQuery.name,
            sql: savedQuery.sql,
          },
        });
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
    onError: (error: Error) => {
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
    onSuccess: (_data: unknown, queryIds: string[]) => {
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
