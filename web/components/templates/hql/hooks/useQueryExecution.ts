import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { components } from "@/lib/clients/jawnTypes/public";
import { createExecuteQueryMutation } from "../constants";

export interface QueryExecutionState {
  result: components["schemas"]["ExecuteSqlResponse"];
  loading: boolean;
  error: string | null;
}

export function useQueryExecution() {
  const [result, setResult] = useState<
    components["schemas"]["ExecuteSqlResponse"]
  >({
    rows: [],
    elapsedMilliseconds: 0,
    size: 0,
    rowCount: 0,
  });
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  const { mutate: handleExecuteQuery, mutateAsync: handleExecuteQueryAsync } =
    useMutation<any, Error, string>(
      createExecuteQueryMutation(setResult, setQueryError, setQueryLoading)
    );

  return {
    result,
    queryLoading,
    queryError,
    handleExecuteQuery,
    handleExecuteQueryAsync,
    setResult,
    setQueryError,
    setQueryLoading,
  };
}