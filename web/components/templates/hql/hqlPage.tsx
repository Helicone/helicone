import { components } from "@/lib/clients/jawnTypes/public";
import { useClickhouseSchemas } from "@/services/hooks/heliconeSql";
import { useMonaco, Editor } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
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
import { ALL_KEYWORDS, addPaginationToQuery } from "./constants";
import {
  getTableNames,
  getTableNamesSet,
  parseSqlAndFindTableNameAndAliases,
  useSaveQueryMutation,
  createExecuteQueryMutation,
} from "./constants";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useHeliconeAgent } from "../agent/HeliconeAgentContext";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import { useTheme } from "next-themes";

function HQLPage() {
  const organization = useOrg();
  const { data: hasAccessToHQL, isLoading: isLoadingFeatureFlag } =
    useFeatureFlag("hql", organization?.currentOrg?.id ?? "");
  const { setNotification } = useNotification();
  const { theme: currentTheme } = useTheme();

  const monaco = useMonaco();
  const clickhouseSchemas = useClickhouseSchemas();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [activeTab, setActiveTab] = useState<"tables" | "queries">("tables");

  const [result, setResult] = useState<
    components["schemas"]["ExecuteSqlResponse"]
  >({
    rows: [],
    elapsedMilliseconds: 0,
    size: 0,
    rowCount: 0,
  });
  const [currentQuery, setCurrentQuery] = useState<{
    id: string | undefined;
    name: string;
    sql: string;
  }>({
    id: undefined,
    name: "Untitled query",
    sql: "select * from request_response_rmt",
  });
  const [queryLoading, setQueryLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalRows, setTotalRows] = useState(0);
  const [queryError, setQueryError] = useState<string | null>(null);
  const { mutate: handleExecuteQuery, mutateAsync: handleExecuteQueryAsync } =
    useMutation(
      createExecuteQueryMutation(
        (data) => {
          setResult(data);
          setTotalRows(data.rowCount);
        },
        setQueryError,
        setQueryLoading,
      ),
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
  }, [clickhouseSchemas.data]);

  useEffect(() => {
    setToolHandler("hql-write-query", async ({ query }) => {
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
  }, []);

  useEffect(() => {
    setToolHandler("hql-run-query", async () => {
      const paginatedSql = addPaginationToQuery(
        currentQuery.sql,
        (currentPage - 1) * rowsPerPage,
        rowsPerPage,
      );
      const response = await handleExecuteQueryAsync(paginatedSql);
      return {
        success: !response.error && !response.data.error,
        message:
          response.error ||
          response.data.error ||
          JSON.stringify((response?.data?.data || response?.data) ?? {}),
      };
    });
  }, [currentQuery.sql, currentPage, rowsPerPage]);

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
      <EmptyStateCard
        feature="hql"
        onPrimaryClick={() => {
          window.open("https://forms.gle/YXYkFz9Zaa7fWF2v7", "_blank");
        }}
      />
    );
  }

  return (
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
              handleExecuteQuery={(sql) => {
                setCurrentPage(1);
                const paginatedSql = addPaginationToQuery(sql, 0, rowsPerPage);
                handleExecuteQuery(paginatedSql);
              }}
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
                      setCurrentPage(1);
                      const paginatedSql = addPaginationToQuery(
                        latestQueryRef.current.sql,
                        0,
                        rowsPerPage,
                      );
                      handleExecuteQuery(paginatedSql);
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
                  setCurrentQuery({
                    id: currentQuery.id,
                    name: currentQuery.name,
                    sql: value ?? "",
                  });
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
              currentPage={currentPage}
              rowsPerPage={rowsPerPage}
              totalRows={totalRows}
              onPageChange={(page) => {
                setCurrentPage(page);
                const paginatedSql = addPaginationToQuery(
                  currentQuery.sql,
                  (page - 1) * rowsPerPage,
                  rowsPerPage,
                );
                handleExecuteQuery(paginatedSql);
              }}
              onRowsPerPageChange={(rows) => {
                setRowsPerPage(rows);
                setCurrentPage(1);
                const paginatedSql = addPaginationToQuery(
                  currentQuery.sql,
                  0,
                  rows,
                );
                handleExecuteQuery(paginatedSql);
              }}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default HQLPage;
