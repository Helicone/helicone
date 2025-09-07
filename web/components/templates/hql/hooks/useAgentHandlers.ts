import { useEffect } from "react";
import { useHeliconeAgent } from "../../agent/HeliconeAgentContext";
import { QueryState } from "../types";

interface UseAgentHandlersProps {
  clickhouseSchemas: any;
  currentQuery: QueryState;
  setCurrentQuery: (query: QueryState) => void;
  handleExecuteQueryAsync: (sql: string) => Promise<any>;
}

export function useAgentHandlers({
  clickhouseSchemas,
  currentQuery,
  setCurrentQuery,
  handleExecuteQueryAsync,
}: UseAgentHandlersProps) {
  const { setToolHandler } = useHeliconeAgent();

  useEffect(() => {
    setToolHandler("hql-get-schema", async () => {
      if (clickhouseSchemas.data) {
        return {
          success: true,
          message: JSON.stringify(clickhouseSchemas.data),
        };
      } else {
        return {
          success: false,
          message: "Failed to get HQL schema",
        };
      }
    });
  }, [clickhouseSchemas.data, setToolHandler]);

  useEffect(() => {
    setToolHandler("hql-write-query", async ({ query }: { query: string }) => {
      setCurrentQuery({
        id: undefined,
        name: "Untitled query",
        sql: query,
      });
      return {
        success: true,
        message: "Query written successfully",
      };
    });
  }, [setCurrentQuery, setToolHandler]);

  useEffect(() => {
    setToolHandler("hql-run-query", async () => {
      const response = await handleExecuteQueryAsync(currentQuery.sql);
      return {
        success: !response.error && !response.data.error,
        message:
          response.error ||
          response.data.error ||
          JSON.stringify((response?.data?.data || response?.data) ?? {}),
      };
    });
  }, [currentQuery.sql, handleExecuteQueryAsync, setToolHandler]);
}


