"use client";
import { useClickhouseSchemas } from "@/services/hooks/heliconeSql";
import { useEffect, useRef, useState } from "react";
import TopBar from "./topBar";
import { Directory } from "./directory";
import QueryResult from "./QueryResult";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import dynamic from "next/dynamic";
import { $JAWN_API } from "@/lib/clients/jawn";
import { useMutation } from "@tanstack/react-query";
import { useFeatureFlag } from "@/services/hooks/admin";
import { useOrg } from "@/components/layout/org/organizationContext";
import useNotification from "@/components/shared/notification/useNotification";
import { useSaveQueryMutation } from "./constants";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
const QueryEditor = dynamic(() => import("./QueryEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-40 w-full items-center justify-center">
      <div className="text-sm">Loading editor…</div>
    </div>
  ),
});
import { useMonacoSetup } from "./hooks/useMonacoSetup";
import { useQueryExecution } from "./hooks/useQueryExecution";
import { useAgentHandlers } from "./hooks/useAgentHandlers";
import {
  DEFAULT_QUERY_NAME,
  DEFAULT_QUERY_SQL,
  HQL_WAITLIST_FORM_URL,
  QUERY_RESULT_LIMIT,
  RESIZABLE_PANEL_SIZES,
} from "./config";

function HQLPage() {
  const organization = useOrg();
  const { data: hasAccessToHQL, isLoading: isLoadingFeatureFlag } =
    useFeatureFlag("hql", organization?.currentOrg?.id ?? "");
  const { setNotification } = useNotification();

  const clickhouseSchemas = useClickhouseSchemas();
  const { editorRef } = useMonacoSetup({
    clickhouseSchemas: clickhouseSchemas.data,
    currentQuery: { sql: "" },
  });
  const [activeTab, setActiveTab] = useState<"tables" | "queries">("tables");

  const {
    result,
    queryLoading,
    queryError,
    handleExecuteQuery,
    handleExecuteQueryAsync,
    setResult,
    setQueryError,
    setQueryLoading,
  } = useQueryExecution();
  const [currentQuery, setCurrentQuery] = useState<{
    id: string | undefined;
    name: string;
    sql: string;
  }>({
    id: undefined,
    name: DEFAULT_QUERY_NAME,
    sql: DEFAULT_QUERY_SQL,
  });

  // a hack to get the latest query in the editor
  const latestQueryRef = useRef(currentQuery);
  const { mutate: handleSaveQuery } = useMutation(
    useSaveQueryMutation(setCurrentQuery, setNotification),
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
      },
    );

  useAgentHandlers({
    clickhouseSchemas,
    currentQuery,
    setCurrentQuery: (q) => setCurrentQuery({ id: q.id, name: q.name, sql: q.sql }),
    handleExecuteQueryAsync,
  });

  useEffect(() => {
    if (savedQueryDetails?.data) {
      setCurrentQuery({
        id: savedQueryDetails.data.id,
        name: savedQueryDetails.data.name,
        sql: savedQueryDetails.data.sql,
      });

      if (editorRef.current) {
        editorRef.current.setValue(savedQueryDetails.data.sql);
      }
    }
  }, [savedQueryDetails]);

  // useMonacoSetup handles autocompletion registration

  useEffect(() => {
    latestQueryRef.current = currentQuery;
  }, [currentQuery]);

  if (isLoadingFeatureFlag || savedQueryDetailsLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!hasAccessToHQL?.data) {
    return (
      <EmptyStateCard
        feature="hql"
        onPrimaryClick={() => {
          window.open(HQL_WAITLIST_FORM_URL, "_blank");
        }}
      />
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-screen w-full">
      <ResizablePanel
        defaultSize={RESIZABLE_PANEL_SIZES.sidebar.default}
        minSize={RESIZABLE_PANEL_SIZES.sidebar.min}
        maxSize={RESIZABLE_PANEL_SIZES.sidebar.max}
        collapsible={true}
        collapsedSize={0}
      >
        <Directory
          tables={clickhouseSchemas.data ?? []}
          currentQuery={currentQuery}
          setCurrentQuery={setCurrentQuery}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={RESIZABLE_PANEL_SIZES.main.default}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel
            defaultSize={RESIZABLE_PANEL_SIZES.editor.default}
            minSize={RESIZABLE_PANEL_SIZES.editor.min}
            collapsible={false}
            className="flex min-h-[64px] flex-col"
          >
            <TopBar
              currentQuery={currentQuery}
              handleExecuteQuery={handleExecuteQuery}
              handleSaveQuery={handleSaveQuery}
              handleRenameQuery={(newName) => {
                setCurrentQuery({
                  id: currentQuery.id,
                  name: newName,
                  sql: currentQuery.sql,
                });
              }}
            />
            <div className="relative flex-1">
              <QueryEditor
                sql={currentQuery.sql}
                onSqlChange={(value) =>
                  setCurrentQuery({ id: currentQuery.id, name: currentQuery.name, sql: value })
                }
                onExecute={(sql) => handleExecuteQuery(sql)}
                onSave={(query) => handleSaveQuery(query)}
                editorRef={editorRef}
                latestQueryRef={latestQueryRef}
                currentQuery={currentQuery}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle={true} />
          <ResizablePanel
            className="max-h-full max-w-full overflow-x-scroll !overflow-y-scroll"
            collapsible={true}
            collapsedSize={RESIZABLE_PANEL_SIZES.results.collapsed}
            defaultSize={RESIZABLE_PANEL_SIZES.results.default}
          >
            {result.rowCount >= QUERY_RESULT_LIMIT && (
              <Alert variant="warning" className="mb-2">
                <AlertTitle>Row Limit Reached</AlertTitle>
                <AlertDescription>
                  Only the first {QUERY_RESULT_LIMIT} rows are shown. Please refine your query
                  for more specific results. Or download for more data.
                </AlertDescription>
              </Alert>
            )}
            <QueryResult
              sql={currentQuery.sql}
              result={result.rows}
              queryStats={{
                elapsedMilliseconds: result.elapsedMilliseconds,
                rowCount: result.rowCount,
                size: result.size,
                rows: result.rows,
              }}
              loading={queryLoading}
              error={queryError}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default HQLPage;
