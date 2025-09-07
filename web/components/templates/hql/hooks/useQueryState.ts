import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { $JAWN_API } from "@/lib/clients/jawn";
import useNotification from "@/components/shared/notification/useNotification";
import { useSaveQueryMutation } from "../constants";

export interface QueryState {
  id: string | undefined;
  name: string;
  sql: string;
}

export function useQueryState(initialSql: string = "select * from request_response_rmt") {
  const { setNotification } = useNotification();
  const [currentQuery, setCurrentQuery] = useState<QueryState>({
    id: undefined,
    name: "Untitled query",
    sql: initialSql,
  });

  const latestQueryRef = useRef(currentQuery);

  useEffect(() => {
    latestQueryRef.current = currentQuery;
  }, [currentQuery]);

  const { mutate: handleSaveQuery } = useMutation(
    useSaveQueryMutation(setCurrentQuery, setNotification)
  );

  const { data: savedQueryDetails, isLoading: savedQueryDetailsLoading } =
    $JAWN_API.useQuery(
      "get",
      "/v1/helicone-sql/saved-query/{queryId}",
      {
        params: { path: { queryId: currentQuery.id as string } },
      },
      {
        enabled: !!currentQuery.id,
      }
    );

  useEffect(() => {
    if (savedQueryDetails?.data) {
      setCurrentQuery({
        id: savedQueryDetails.data.id,
        name: savedQueryDetails.data.name,
        sql: savedQueryDetails.data.sql,
      });
    }
  }, [savedQueryDetails]);

  const handleRenameQuery = (newName: string) => {
    setCurrentQuery((prev) => ({
      ...prev,
      name: newName,
    }));
  };

  const updateQuerySql = (sql: string) => {
    setCurrentQuery((prev) => ({
      ...prev,
      sql,
    }));
  };

  return {
    currentQuery,
    setCurrentQuery,
    latestQueryRef,
    handleSaveQuery,
    handleRenameQuery,
    updateQuerySql,
    savedQueryDetailsLoading,
  };
}