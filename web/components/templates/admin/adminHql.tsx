import { components } from "@/lib/clients/jawnTypes/public";
import { useClickhouseSchemas } from "@/services/hooks/heliconeSql";
import { useMonaco, Editor } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import TopBar from "../hql/topBar";
import { Directory as AdminDirectory } from "./adminDirectory";
import QueryResult from "../hql/QueryResult";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { editor } from "monaco-editor";
import * as monaco from "monaco-editor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useNotification from "@/components/shared/notification/useNotification";
import { ALL_KEYWORDS } from "../hql/constants";
import {
  getTableNames,
  getTableNamesSet,
  parseSqlAndFindTableNameAndAliases,
} from "../hql/constants";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useTheme } from "next-themes";
import { getJawnClient } from "@/lib/clients/jawn";
import { useOrg } from "@/components/layout/org/organizationContext";

// Default query for AI Gateway candidates
const DEFAULT_QUERY = `SELECT
  organization_id,
  COUNT(*) as total_requests,
  SUM(cost) / 1000000 as total_cost_usd,
  AVG(cost) / 1000000 as avg_cost_per_request_usd
FROM request_response_rmt
WHERE
  request_created_at >= now() - INTERVAL 30 DAY
  AND cost > 0
GROUP BY organization_id
HAVING total_requests >= 100000
ORDER BY total_cost_usd DESC
LIMIT 50`;

function AdminHql() {
  const org = useOrg();
  const { setNotification } = useNotification();
  const { theme: currentTheme } = useTheme();

  const monaco = useMonaco();
  const clickhouseSchemas = useClickhouseSchemas();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [activeTab, setActiveTab] = useState<"tables" | "queries">("tables");

  // Load panel sizes from localStorage
  const [sidebarSize, setSidebarSize] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin-hql-sidebar-size");
      return saved ? parseFloat(saved) : 25;
    }
    return 25;
  });

  const [editorSize, setEditorSize] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin-hql-editor-size");
      return saved ? parseFloat(saved) : 75;
    }
    return 75;
  });

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
    name: "Untitled Query",
    sql: DEFAULT_QUERY,
  });
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Custom execute query mutation for admin enriched endpoint
  const { mutate: handleExecuteQuery } = useMutation({
    mutationFn: async (sql: string) => {
      setQueryLoading(true);
      const jawn = getJawnClient(org?.currentOrg?.id);
      const response = await jawn.POST("/v1/admin/hql-enriched", {
        body: { sql, limit: 100 },
      });
      return response;
    },
    onSuccess: (data: any) => {
      setQueryLoading(false);
      if (data.error || !data.data?.data) {
        // @ts-ignore
        setQueryError(data.error?.error || data.error);
        setNotification(data.error?.error || data.error, "error");
        setResult({
          rows: [],
          elapsedMilliseconds: 0,
          size: 0,
          rowCount: 0,
        });
      } else {
        setQueryError(null);
        setResult({
          rows: data.data.data.rows,
          elapsedMilliseconds: data.data.data.elapsedMilliseconds,
          size: data.data.data.size,
          rowCount: data.data.data.rowCount,
        });
      }
    },
    onError: (error: any) => {
      setQueryLoading(false);
      setQueryError(error.message);
      setNotification(error.message, "error");
      setResult({
        rows: [],
        elapsedMilliseconds: 0,
        size: 0,
        rowCount: 0,
      });
    },
  });

  // a hack to get the latest query in the editor
  const latestQueryRef = useRef(currentQuery);
  const queryClient = useQueryClient();

  // Custom admin save mutation that uses admin endpoints
  const { mutate: handleSaveQuery } = useMutation({
    mutationFn: async (savedQuery: {
      id?: string;
      name: string;
      sql: string;
    }) => {
      const jawn = getJawnClient(org?.currentOrg?.id);

      if (savedQuery.id) {
        // Update existing query using admin endpoint
        const response = await jawn.PATCH("/v1/admin/saved-query/{queryId}", {
          params: { path: { queryId: savedQuery.id } },
          body: {
            name: savedQuery.name,
            sql: savedQuery.sql,
          },
        });
        return response;
      } else {
        // Create new query using admin endpoint
        const response = await jawn.POST("/v1/admin/saved-query", {
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
        queryKey: ["get", "/v1/admin/saved-queries"],
      });
      setNotification("Successfully saved admin query", "success");
    },
    onError: (error: any) => {
      setNotification(error.message, "error");
    },
  });

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
  }, [monaco, clickhouseSchemas.data, currentQuery.sql]);

  useEffect(() => {
    latestQueryRef.current = currentQuery;
  }, [currentQuery]);

  return (
    <div className="flex h-screen w-full flex-col">
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1"
        onLayout={(sizes) => {
          if (sizes[0] !== undefined) {
            setSidebarSize(sizes[0]);
            localStorage.setItem("admin-hql-sidebar-size", sizes[0].toString());
          }
        }}
      >
        <ResizablePanel
          defaultSize={sidebarSize}
          minSize={18}
          maxSize={40}
          collapsible={true}
          collapsedSize={0}
        >
          <AdminDirectory
            tables={clickhouseSchemas.data ?? []}
            currentQuery={currentQuery}
            setCurrentQuery={setCurrentQuery}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={100 - sidebarSize}>
          <ResizablePanelGroup
            direction="vertical"
            onLayout={(sizes) => {
              if (sizes[0] !== undefined) {
                setEditorSize(sizes[0]);
                localStorage.setItem(
                  "admin-hql-editor-size",
                  sizes[0].toString(),
                );
              }
            }}
          >
            <ResizablePanel
              defaultSize={editorSize}
              minSize={20}
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
                <Editor
                  defaultLanguage="sql"
                  defaultValue={currentQuery.sql}
                  theme={
                    currentTheme === "dark" ? "custom-dark" : "custom-light"
                  }
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
                      monaco.editor.setModelMarkers(
                        model,
                        "custom-sql-validation",
                        [],
                      );
                    }

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
                    setCurrentQuery({
                      id: currentQuery.id,
                      name: currentQuery.name,
                      sql: value ?? "",
                    });
                    if (value) {
                      if (!monaco || !editorRef.current) return;

                      const model = editorRef.current.getModel();
                      if (!model) return;

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
              defaultSize={100 - editorSize}
            >
              {result.rowCount >= 100 && (
                <Alert variant="warning" className="mb-2">
                  <AlertTitle>Row Limit Reached</AlertTitle>
                  <AlertDescription>
                    Only the first 100 rows are shown. Please refine your query
                    for more specific results.
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
                enableAdminLinks={true}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default AdminHql;
