import React, { useState, useMemo } from "react";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useFeatureFlag } from "@/services/hooks/admin";
import { useClickhouseSchemas } from "@/services/hooks/heliconeSql";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import TopBar from "./topBar";
import { Directory } from "./directory";
import QueryResult from "./QueryResult";
import QueryEditor from "./QueryEditor";

import { useQueryState } from "./hooks/useQueryState";
import { useQueryExecution } from "./hooks/useQueryExecution";
import { useMonacoSetup } from "./hooks/useMonacoSetup";
import { useAgentHandlers } from "./hooks/useAgentHandlers";

import { 
  RESIZABLE_PANEL_SIZES, 
  QUERY_RESULT_LIMIT,
  HQL_WAITLIST_FORM_URL,
  DEFAULT_QUERY_SQL 
} from "./config";

const HQLPage: React.FC = () => {
  const organization = useOrg();
  const { data: hasAccessToHQL, isLoading: isLoadingFeatureFlag } =
    useFeatureFlag("hql", organization?.currentOrg?.id ?? "");
  
  const clickhouseSchemas = useClickhouseSchemas();
  const [activeTab, setActiveTab] = useState<"tables" | "queries">("tables");

  const {
    currentQuery,
    setCurrentQuery,
    latestQueryRef,
    handleSaveQuery,
    handleRenameQuery,
    updateQuerySql,
    savedQueryDetailsLoading,
  } = useQueryState(DEFAULT_QUERY_SQL);

  const {
    result,
    queryLoading,
    queryError,
    handleExecuteQuery,
    handleExecuteQueryAsync,
  } = useQueryExecution();

  const { editorRef } = useMonacoSetup({
    clickhouseSchemas: clickhouseSchemas.data,
    currentQuery,
  });

  useAgentHandlers({
    clickhouseSchemas,
    currentQuery,
    setCurrentQuery,
    handleExecuteQueryAsync,
  });

  const isLoading = useMemo(
    () => isLoadingFeatureFlag || savedQueryDetailsLoading,
    [isLoadingFeatureFlag, savedQueryDetailsLoading]
  );

  const showRowLimitWarning = useMemo(
    () => result.rowCount >= QUERY_RESULT_LIMIT,
    [result.rowCount]
  );

  if (isLoading) {
    return <LoadingState />;
  }

  if (!hasAccessToHQL?.data) {
    return (
      <EmptyStateCard
        feature="hql"
        onPrimaryClick={() => window.open(HQL_WAITLIST_FORM_URL, "_blank")}
      />
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-screen w-full">
      <ResizablePanel
        defaultSize={RESIZABLE_PANEL_SIZES.sidebar.default}
        minSize={RESIZABLE_PANEL_SIZES.sidebar.min}
        maxSize={RESIZABLE_PANEL_SIZES.sidebar.max}
        collapsible
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
              handleRenameQuery={handleRenameQuery}
            />
            <div className="relative flex-1">
              <QueryEditor
                sql={currentQuery.sql}
                onSqlChange={updateQuerySql}
                onExecute={handleExecuteQuery}
                onSave={handleSaveQuery}
                editorRef={editorRef}
                latestQueryRef={latestQueryRef}
                currentQuery={currentQuery}
              />
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel
            className="max-h-full max-w-full overflow-x-scroll !overflow-y-scroll"
            collapsible
            collapsedSize={RESIZABLE_PANEL_SIZES.results.collapsed}
            defaultSize={RESIZABLE_PANEL_SIZES.results.default}
          >
            {showRowLimitWarning && <RowLimitWarning />}
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
};

const LoadingState: React.FC = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <div className="text-lg">Loading...</div>
  </div>
);

const RowLimitWarning: React.FC = () => (
  <Alert variant="warning" className="mb-2">
    <AlertTitle>Row Limit Reached</AlertTitle>
    <AlertDescription>
      Only the first {QUERY_RESULT_LIMIT} rows are shown. Please refine your query
      for more specific results. Or download for more data.
    </AlertDescription>
  </Alert>
);

export default HQLPage;