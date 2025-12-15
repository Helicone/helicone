import { components } from "@/lib/clients/jawnTypes/public";
import { useClickhouseSchemas } from "@/services/hooks/heliconeSql";
import { useMonaco, Editor } from "@monaco-editor/react";
import { useCallback, useEffect, useRef, useState } from "react";
import TopBar from "./topBar";
import { Directory } from "./directory";
import QueryResult from "./QueryResult";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { editor } from "monaco-editor";
import * as monaco from "monaco-editor";
import { $JAWN_API } from "@/lib/clients/jawn";
import { useMutation } from "@tanstack/react-query";
import { useFeatureFlag } from "@/services/hooks/admin";
import { useOrg } from "@/components/layout/org/organizationContext";
import useNotification from "@/components/shared/notification/useNotification";
import { ALL_KEYWORDS } from "./constants";
import {
  getTableNames,
  getTableNamesSet,
  parseSqlAndFindTableNameAndAliases,
  useSaveQueryMutation,
  createExecuteQueryMutation,
} from "./constants";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useHeliconeAgent } from "../agent/HeliconeAgentContext";
import { useTheme } from "next-themes";
import { FeatureWaitlist } from "@/components/templates/waitlist/FeatureWaitlist";

// Tab system types
export interface QueryTab {
  id: string;
  savedQueryId?: string;
  name: string;
  sql: string;
  isDirty: boolean;
}

const MAX_TABS = 10;
const DEFAULT_SQL = "select * from request_response_rmt";

const HQL_TABS_KEY = "hql-tabs";

function generateTabId(): string {
  return crypto.randomUUID();
}

function getInitialTabs(): QueryTab[] {
  if (typeof window === "undefined") {
    return [{
      id: generateTabId(),
      name: "Untitled query",
      sql: DEFAULT_SQL,
      isDirty: false,
    }];
  }
  try {
    const saved = localStorage.getItem(HQL_TABS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return [{
    id: generateTabId(),
    name: "Untitled query",
    sql: DEFAULT_SQL,
    isDirty: false,
  }];
}

function getInitialActiveTabId(tabs: QueryTab[]): string {
  if (typeof window === "undefined" || tabs.length === 0) {
    return tabs[0]?.id || generateTabId();
  }
  try {
    const saved = localStorage.getItem(HQL_TABS_KEY + "-active");
    if (saved && tabs.some(t => t.id === saved)) {
      return saved;
    }
  } catch {
    // Ignore
  }
  return tabs[0].id;
}

function HQLPage() {
  const organization = useOrg();
  const { data: hasAccessToHQL, isLoading: isLoadingFeatureFlag } =
    useFeatureFlag("hql", organization?.currentOrg?.id ?? "");
  const { setNotification } = useNotification();
  const { theme: currentTheme } = useTheme();

  const monaco = useMonaco();
  const clickhouseSchemas = useClickhouseSchemas();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [activeTab, setActiveTab] = useState<"tables" | "queries">("queries");

  const [result, setResult] = useState<
    components["schemas"]["ExecuteSqlResponse"]
  >({
    rows: [],
    elapsedMilliseconds: 0,
    size: 0,
    rowCount: 0,
  });

  // Multi-tab state
  const [tabs, setTabsState] = useState<QueryTab[]>(getInitialTabs);
  const [activeTabId, setActiveTabIdState] = useState<string>(() => getInitialActiveTabId(tabs));

  // Close tab confirmation modal state
  const [closeTabConfirm, setCloseTabConfirm] = useState<{
    isOpen: boolean;
    tabId: string | null;
    tabName: string;
  }>({ isOpen: false, tabId: null, tabName: "" });

  // Get the current active tab
  const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Compatibility layer: currentQuery derived from currentTab
  const currentQuery = {
    id: currentTab?.savedQueryId,
    name: currentTab?.name || "Untitled query",
    sql: currentTab?.sql || DEFAULT_SQL,
  };

  // Persist tabs to localStorage
  const setTabs = useCallback((newTabs: QueryTab[] | ((prev: QueryTab[]) => QueryTab[])) => {
    setTabsState((prev) => {
      const result = typeof newTabs === "function" ? newTabs(prev) : newTabs;
      localStorage.setItem(HQL_TABS_KEY, JSON.stringify(result));
      return result;
    });
  }, []);

  const setActiveTabId = useCallback((id: string) => {
    setActiveTabIdState(id);
    localStorage.setItem(HQL_TABS_KEY + "-active", id);
  }, []);

  // Tab operations
  const openNewTab = useCallback((query?: { name: string; sql: string; savedQueryId?: string }) => {
    if (tabs.length >= MAX_TABS) {
      setNotification("Maximum 10 tabs allowed. Close some tabs first.", "error");
      return;
    }

    const newTab: QueryTab = {
      id: generateTabId(),
      savedQueryId: query?.savedQueryId,
      name: query?.name || "Untitled query",
      sql: query?.sql || DEFAULT_SQL,
      isDirty: false,
    };

    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);

    // Update editor
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.setValue(newTab.sql);
      }
    }, 0);
  }, [tabs, setTabs, setActiveTabId, setNotification]);

  // Helper to perform the actual tab close
  const performCloseTab = useCallback((tabId: string) => {
    const newTabs = tabs.filter((t) => t.id !== tabId);
    if (newTabs.length === 0) {
      // Always keep at least one tab
      const newTab: QueryTab = {
        id: generateTabId(),
        name: "Untitled query",
        sql: DEFAULT_SQL,
        isDirty: false,
      };
      setTabs([newTab]);
      setActiveTabId(newTab.id);
      if (editorRef.current) {
        editorRef.current.setValue(newTab.sql);
      }
    } else {
      if (activeTabId === tabId) {
        const idx = tabs.findIndex((t) => t.id === tabId);
        const newActiveTab = newTabs[Math.min(idx, newTabs.length - 1)];
        setActiveTabId(newActiveTab.id);
        if (editorRef.current) {
          editorRef.current.setValue(newActiveTab.sql);
        }
      }
      setTabs(newTabs);
    }
  }, [tabs, activeTabId, setTabs, setActiveTabId]);

  const closeTab = useCallback((tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab?.isDirty) {
      // Show confirmation modal for dirty tabs
      setCloseTabConfirm({
        isOpen: true,
        tabId,
        tabName: tab.name,
      });
      return;
    }
    performCloseTab(tabId);
  }, [tabs, performCloseTab]);

  const switchTab = useCallback((tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      setActiveTabId(tabId);
      if (editorRef.current) {
        editorRef.current.setValue(tab.sql);
      }
    }
  }, [tabs, setActiveTabId]);

  const updateCurrentTabContent = useCallback((sql: string) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, sql, isDirty: true } : t
      )
    );
  }, [activeTabId, setTabs]);

  const updateCurrentTabName = useCallback((name: string) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, name } : t
      )
    );
  }, [activeTabId, setTabs]);

  // Handler for loading queries from sidebar (predefined or saved)
  const handleLoadQuery = useCallback((query: { name: string; sql: string; savedQueryId?: string }) => {
    // Check if current tab is empty/default
    const isCurrentTabEmpty =
      currentTab?.sql === DEFAULT_SQL && !currentTab?.isDirty && !currentTab?.savedQueryId;

    if (isCurrentTabEmpty) {
      // Load into current tab
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, name: query.name, sql: query.sql, savedQueryId: query.savedQueryId, isDirty: false }
            : t
        )
      );
      if (editorRef.current) {
        editorRef.current.setValue(query.sql);
      }
    } else {
      // Open in new tab
      openNewTab(query);
    }
  }, [currentTab, activeTabId, setTabs, openNewTab]);

  // Wrapper for setCurrentQuery compatibility
  const setCurrentQuery = useCallback((query: { id: string | undefined; name: string; sql: string }) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? { ...t, savedQueryId: query.id, name: query.name, sql: query.sql, isDirty: false }
          : t
      )
    );
    if (editorRef.current && query.sql !== currentTab?.sql) {
      editorRef.current.setValue(query.sql);
    }
  }, [activeTabId, currentTab, setTabs]);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const { mutate: handleExecuteQuery, mutateAsync: handleExecuteQueryAsync } =
    useMutation(
      createExecuteQueryMutation(setResult, setQueryError, setQueryLoading),
    );

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

  const { setToolHandler, setAgentChatOpen } = useHeliconeAgent();

  // Sync editor with stored tabs on mount (handles SSR hydration).
  // Empty deps intentional: tab switching is handled by switchTab().
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (currentTab && editorRef.current) {
      editorRef.current.setValue(currentTab.sql);
    }
  }, []);

  useEffect(() => {
    setToolHandler("hql-get-schema", async () => {
      if (clickhouseSchemas.data) {
        // Add helpful context for the AI agent alongside the schema
        const COST_PRECISION_MULTIPLIER = 1_000_000_000;
        const schemaWithNotes = {
          schema: clickhouseSchemas.data,
          importantNotes: [
            `COST: The 'cost' column stores cost as an integer multiplied by ${COST_PRECISION_MULTIPLIER}. To get the actual cost in USD, you MUST divide by ${COST_PRECISION_MULTIPLIER}. Example: SUM(cost) / ${COST_PRECISION_MULTIPLIER} as total_cost_usd`,
            "TIMESTAMPS: Use 'request_created_at' for filtering and grouping by time. It's a DateTime64 column.",
            "DATE GROUPING: Use toDate(request_created_at) when grouping by day, toStartOfWeek(request_created_at) for weeks, toStartOfMonth(request_created_at) for months.",
            `AGGREGATIONS: For cost totals use SUM(cost) / ${COST_PRECISION_MULTIPLIER}, for averages use AVG(cost) / ${COST_PRECISION_MULTIPLIER}, for counts use COUNT(*).`,
            "MODEL: The 'model' column contains the LLM model name (e.g., 'gpt-4', 'claude-3-opus').",
            "TOKENS: Use 'prompt_tokens' and 'completion_tokens' for token counts. 'total_tokens' = prompt_tokens + completion_tokens.",
            "STATUS: The 'status' column contains the HTTP status code (200 = success, 4xx/5xx = errors).",
            "LATENCY: Use 'latency' for request latency in milliseconds.",
          ],
          exampleQueries: [
            `Total cost by day: SELECT toDate(request_created_at) as date, SUM(cost) / ${COST_PRECISION_MULTIPLIER} as total_cost_usd FROM request_response_rmt GROUP BY date ORDER BY date`,
            `Cost by model: SELECT model, SUM(cost) / ${COST_PRECISION_MULTIPLIER} as total_cost_usd, COUNT(*) as requests FROM request_response_rmt GROUP BY model ORDER BY total_cost_usd DESC`,
            "Average latency by model: SELECT model, AVG(latency) as avg_latency_ms FROM request_response_rmt GROUP BY model",
          ],
        };
        return {
          success: true,
          message: JSON.stringify(schemaWithNotes),
        };
      } else {
        return {
          success: false,
          message: "Failed to get HQL schema",
        };
      }
    });
  }, [clickhouseSchemas.data]);

  useEffect(() => {
    setToolHandler("hql-write-query", async ({ query }) => {
      setCurrentQuery({
        id: undefined,
        name: "Untitled query",
        sql: query,
      });
      // Also update the Monaco editor's value directly
      if (editorRef.current) {
        editorRef.current.setValue(query);
      }
      return {
        success: true,
        message: "Query written successfully",
      };
    });
  }, []);

  useEffect(() => {
    setToolHandler("hql-run-query", async () => {
      try {
        const response = await handleExecuteQueryAsync(currentQuery.sql);

        // Helper to extract a valid error message string
        const extractErrorMessage = (err: unknown): string | null => {
          if (!err) return null;
          if (typeof err === "string" && err !== "undefined") return err;
          if (typeof err === "object") {
            const errObj = err as Record<string, unknown>;
            // Check for nested error string
            if (
              typeof errObj.error === "string" &&
              errObj.error !== "undefined"
            ) {
              return errObj.error;
            }
            // Check for message property
            if (
              typeof errObj.message === "string" &&
              errObj.message !== "undefined"
            ) {
              return errObj.message;
            }
          }
          return null;
        };

        // Check for errors in response.error
        const responseError = (response as { error?: unknown }).error;
        if (responseError) {
          const errorMessage =
            extractErrorMessage(responseError) ||
            "Query execution failed - unknown error";
          return {
            success: false,
            message: errorMessage,
          };
        }

        // Check for errors in response.data.error
        const dataError = (response.data as { error?: unknown } | undefined)?.error;
        if (dataError) {
          const errorMessage =
            extractErrorMessage(dataError) ||
            "Query execution failed";
          return {
            success: false,
            message: errorMessage,
          };
        }

        // Success case
        return {
          success: true,
          message: JSON.stringify(response?.data?.data || response?.data || {}),
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to execute query",
        };
      }
    });
  }, [currentQuery.sql]);

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

  // Keep Monaco theme in sync with app theme
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mono = (window as any).monaco;
    if (!mono || !mono.editor) return;

    // Define transparent background themes once (idempotent)
    try {
      mono.editor.defineTheme("custom-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#00000000",
          "minimap.background": "#1e1e1e",
          "minimapSlider.background": "#79797933",
          "minimapSlider.hoverBackground": "#79797944",
          "minimapSlider.activeBackground": "#79797955",
        },
      });
      mono.editor.defineTheme("custom-light", {
        base: "vs",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#00000000",
          "minimap.background": "#ffffff",
          "minimapSlider.background": "#64646433",
          "minimapSlider.hoverBackground": "#64646444",
          "minimapSlider.activeBackground": "#64646455",
        },
      });
    } catch (e) {
      // themes may already be defined; ignore
    }

    mono.editor.setTheme(
      currentTheme === "dark" ? "custom-dark" : "custom-light",
    );
  }, [currentTheme]);

  // Setup autocompletion
  useEffect(() => {
    if (!monaco || !clickhouseSchemas.data) return;

    const tableSchema = clickhouseSchemas.data;
    const schemaTableNames = getTableNames(tableSchema);
    const schemaTableNamesSet = getTableNamesSet(tableSchema);

    const disposable = monaco.languages.registerCompletionItemProvider("*", {
      provideCompletionItems: (model, position) => {
        let suggestions: monaco.languages.CompletionItem[] = [];

        const word = model.getWordUntilPosition(position);
        const range = new monaco.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn,
        );

        const tableNamesAndAliases = new Map(
          parseSqlAndFindTableNameAndAliases(currentQuery.sql).map(
            ({ table_name, alias }) => [alias, table_name],
          ),
        );

        const thisLine = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const thisToken = thisLine.trim().split(" ").slice(-1)?.[0] || "";
        const lastTokenBeforeSpace = /\s?(\w+)\s+\w+$/.exec(
          thisLine.trim(),
        )?.[1];
        const lastTokenBeforeDot = /(\w+)\.\w*$/.exec(thisToken)?.[1];

        // Table name suggestions after FROM/JOIN/UPDATE/INTO
        if (
          lastTokenBeforeSpace &&
          /from|join|update|into/i.test(lastTokenBeforeSpace)
        ) {
          suggestions.push(
            ...schemaTableNames.map((table_name) => ({
              label: table_name,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: table_name,
              range,
            })),
          );
        }

        // Column suggestions after table alias or table name and dot
        if (lastTokenBeforeDot) {
          let table_name: string | undefined = undefined;
          if (schemaTableNamesSet.has(lastTokenBeforeDot)) {
            table_name = lastTokenBeforeDot;
          } else if (tableNamesAndAliases.get(lastTokenBeforeDot)) {
            table_name = tableNamesAndAliases.get(lastTokenBeforeDot);
          }
          if (table_name) {
            suggestions.push(
              ...tableSchema
                .filter((d) => d.table_name === table_name)
                .flatMap((d) =>
                  d.columns.map((col) => ({
                    label: col.name,
                    kind: monaco.languages.CompletionItemKind.Field,
                    insertText: col.name,
                    detail: col.type,
                    documentation: col.type,
                    range,
                  })),
                ),
            );
          }
        }

        suggestions.push(
          ...ALL_KEYWORDS.map((keyword: string) => ({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            detail: keyword.includes("(")
              ? "ClickHouse function"
              : "SQL keyword",
            sortText: "1" + keyword, // Sort keywords before other suggestions
            range,
          })),
        );

        // Remove duplicates by insertText
        const seen = new Set();
        suggestions = suggestions.filter((s) => {
          if (seen.has(s.insertText)) return false;
          seen.add(s.insertText);
          return true;
        });

        return { suggestions };
      },
    });

    return () => disposable.dispose();
  }, [monaco, clickhouseSchemas.data]);

  useEffect(() => {
    latestQueryRef.current = currentQuery;
  }, [currentQuery]);

  if (
    !organization?.currentOrg?.id ||
    isLoadingFeatureFlag ||
    savedQueryDetailsLoading
  ) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (hasAccessToHQL?.data === false) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-900">
          <FeatureWaitlist
            feature="hql"
            title="Get Early Access"
            description="Be the first to know when HQL launches for your organization."
            organizationId={organization?.currentOrg?.id}
            variant="flat"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Close Tab Confirmation Modal */}
      <AlertDialog
        open={closeTabConfirm.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCloseTabConfirm({ isOpen: false, tabId: null, tabName: "" });
          }
        }}
      >
        <AlertDialogContent
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (closeTabConfirm.tabId) {
                performCloseTab(closeTabConfirm.tabId);
              }
              setCloseTabConfirm({ isOpen: false, tabId: null, tabName: "" });
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${closeTabConfirm.tabName}" has unsaved changes. Are you sure you want to close it?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (closeTabConfirm.tabId) {
                  performCloseTab(closeTabConfirm.tabId);
                }
                setCloseTabConfirm({ isOpen: false, tabId: null, tabName: "" });
              }}
            >
              Close Without Saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ResizablePanelGroup direction="horizontal" className="h-screen w-full">
      <ResizablePanel
        defaultSize={25}
        minSize={18}
        maxSize={40}
        collapsible={true}
        collapsedSize={0}
      >
        <Directory
          tables={clickhouseSchemas.data ?? []}
          currentQuery={currentQuery}
          setCurrentQuery={setCurrentQuery}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLoadQuery={handleLoadQuery}
        />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={80}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel
            defaultSize={75}
            minSize={20}
            collapsible={false}
            className="flex min-h-[64px] flex-col"
          >
            <TopBar
              currentQuery={currentQuery}
              handleExecuteQuery={handleExecuteQuery}
              handleSaveQuery={handleSaveQuery}
              handleRenameQuery={updateCurrentTabName}
              onOpenAssistant={() => setAgentChatOpen(true)}
              tabs={tabs}
              activeTabId={activeTabId}
              onTabSwitch={switchTab}
              onTabClose={closeTab}
              onNewTab={() => openNewTab()}
              maxTabs={MAX_TABS}
            />
            <div className="relative flex-1">
              <Editor
                defaultLanguage="sql"
                defaultValue={currentQuery.sql}
                theme={currentTheme === "dark" ? "custom-dark" : "custom-light"}
                options={{
                  minimap: {
                    enabled: true,
                    side: "right",
                    showSlider: "mouseover",
                    renderCharacters: false,
                    maxColumn: 80,
                  },
                  fontSize: 14,
                  fontFamily: '"Fira Code", "Fira Mono", monospace',
                  wordWrap: "on",
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                }}
                onMount={async (editor, monaco) => {
                  editorRef.current = editor;
                  const model = editor.getModel();
                  if (!model) return;

                  // Define and apply transparent background themes
                  // Apply the custom theme immediately
                  monaco.editor.setTheme(
                    currentTheme === "dark" ? "custom-dark" : "custom-light",
                  );

                  // Regex to match forbidden write statements (case-insensitive, at start of line ignoring whitespace)
                  const forbidden =
                    /\b(insert|update|delete|drop|alter|create|truncate|replace)\b/i;

                  if (forbidden.test(currentQuery.sql)) {
                    monaco.editor.setModelMarkers(
                      model,
                      "custom-sql-validation",
                      [
                        {
                          startLineNumber: 1,
                          startColumn: 1,
                          endLineNumber: 1,
                          endColumn: 1,
                          message:
                            "Only read (SELECT) queries are allowed. Write operations are not permitted.",
                          severity: monaco.MarkerSeverity.Error,
                        },
                      ],
                    );
                  } else {
                    // Clear custom markers if no forbidden statements
                    monaco.editor.setModelMarkers(
                      model,
                      "custom-sql-validation",
                      [],
                    );
                  }
                  editor.onDidChangeModelContent(() => {
                    if (forbidden.test(currentQuery.sql)) {
                      monaco.editor.setModelMarkers(
                        model,
                        "custom-sql-validation",
                        [
                          {
                            startLineNumber: 1,
                            startColumn: 1,
                            endLineNumber: 1,
                            endColumn: 1,
                            message:
                              "Only read (SELECT) queries are allowed. Write operations are not permitted.",
                            severity: monaco.MarkerSeverity.Error,
                          },
                        ],
                      );
                    } else {
                      // Clear custom markers if no forbidden statements
                      monaco.editor.setModelMarkers(
                        model,
                        "custom-sql-validation",
                        [],
                      );
                    }
                  });

                  // Add Command/Ctrl+Enter command
                  editor.addCommand(
                    monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
                    () => {
                      handleExecuteQuery(latestQueryRef.current.sql);
                    },
                  );

                  // Add Command/Ctrl+S command
                  editor.addCommand(
                    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                    () => {
                      handleSaveQuery(latestQueryRef.current);
                    },
                  );
                }}
                onChange={(value) => {
                  updateCurrentTabContent(value ?? "");
                  if (value) {
                    if (!monaco || !editorRef.current) return;

                    const model = editorRef.current.getModel();
                    if (!model) return;

                    // Regex to match forbidden write statements (case-insensitive, at start of line ignoring whitespace)
                    const forbidden =
                      /\b(insert|update|delete|drop|alter|create|truncate|replace)\b/i;

                    if (forbidden.test(value)) {
                      monaco.editor.setModelMarkers(
                        model,
                        "custom-sql-validation",
                        [
                          {
                            startLineNumber: 1,
                            startColumn: 1,
                            endLineNumber: 1,
                            endColumn: 1,
                            message:
                              "Only read (SELECT) queries are allowed. Write operations are not permitted.",
                            severity: monaco.MarkerSeverity.Error,
                          },
                        ],
                      );
                    } else {
                      // Clear custom markers if no forbidden statements
                      monaco.editor.setModelMarkers(
                        model,
                        "custom-sql-validation",
                        [],
                      );
                    }
                  }
                }}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle={true} />
          <ResizablePanel
            className="max-h-full max-w-full overflow-x-scroll !overflow-y-scroll"
            collapsible={true}
            collapsedSize={10}
            defaultSize={25}
          >
            {result.rowCount >= 100 && (
              <Alert variant="warning" className="mb-2">
                <AlertTitle>Row Limit Reached</AlertTitle>
                <AlertDescription>
                  Only the first 100 rows are shown. Please refine your query
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
    </>
  );
}

export default HQLPage;
