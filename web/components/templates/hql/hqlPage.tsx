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
import { ALL_KEYWORDS } from "./constants";
import {
  getTableNames,
  getTableNamesSet,
  parseSqlAndFindTableNameAndAliases,
} from "./constants";

interface HQLPageProps {
  lastestSavedId: string | null;
}

function HQLPage({ lastestSavedId }: HQLPageProps) {
  const organization = useOrg();
  const { data: hasAccessToHQL } = useFeatureFlag(
    "hql",
    organization?.currentOrg?.id ?? "",
  );
  const { setNotification } = useNotification();

  const monaco = useMonaco();
  const clickhouseSchemas = useClickhouseSchemas();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

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
  const [queryError, setQueryError] = useState<string | null>(null);
  const { mutate: handleExecuteQuery } = useMutation({
    mutationFn: async (sql: string) => {
      const response = await $JAWN_API.POST("/v1/helicone-sql/execute", {
        body: {
          sql: sql,
        },
      });

      return response;
    },
    onSuccess: (data) => {
      if (data.error || !data.data?.data) {
        // @ts-ignore
        setQueryError(data.error.error);
        setResult({
          rows: [],
          elapsedMilliseconds: 0,
          size: 0,
          rowCount: 0,
        });
      } else {
        setQueryError(null);
        setResult({
          rows: data.data?.data.rows as Record<string, any>[],
          elapsedMilliseconds: data.data?.data.elapsedMilliseconds,
          size: data.data?.data.size,
          rowCount: data.data?.data.rowCount,
        });
      }
      setQueryLoading(false);
    },
    onError: (error) => {
      setQueryError(error.message);
      setResult({
        rows: [],
        elapsedMilliseconds: 0,
        size: 0,
        rowCount: 0,
      });
      setQueryLoading(false);
    },
  });

  const { mutate: handleSaveQuery } = useMutation({
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
      setNotification("Successfully saved query", "success");
    },
    onError: (error) => {
      setNotification(error.message, "error");
    },
  });

  // Setup autocompletion
  useEffect(() => {
    if (!monaco || !clickhouseSchemas.data) return;

    const tableSchema = clickhouseSchemas.data;
    const schemaTableNames = getTableNames(tableSchema);
    const schemaTableNamesSet = getTableNamesSet(tableSchema);

    const disposable = monaco.languages.registerCompletionItemProvider("sql", {
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

  const { data: savedQueryDetails, isLoading: savedQueryDetailsLoading } =
    $JAWN_API.useQuery("get", "/v1/helicone-sql/saved-query/{queryId}", {
      params: { path: { queryId: lastestSavedId ?? "" } },
    });

  useEffect(() => {
    if (!savedQueryDetailsLoading && savedQueryDetails?.data) {
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

  if (!hasAccessToHQL) {
    return <div>You do not have access to HQL</div>;
  }

  if (savedQueryDetailsLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-row">
      <Directory tables={clickhouseSchemas.data ?? []} />
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel
          defaultSize={75}
          minSize={20}
          collapsible={false}
          className="min-h-[64px]"
        >
          <TopBar
            currentQuery={currentQuery}
            handleExecuteQuery={handleExecuteQuery}
            handleSaveQuery={handleSaveQuery}
          />
          <Editor
            defaultLanguage="sql"
            defaultValue={currentQuery.sql}
            onMount={async (editor, monaco) => {
              editorRef.current = editor;
              const model = editor.getModel();
              if (!model) return;

              // Add keyboard event listener
              editor.onKeyDown((e) => {
                if ((e.ctrlKey || e.metaKey) && e.code === "Enter") {
                  setQueryLoading(true);
                  handleExecuteQuery(currentQuery.sql);
                }
              });

              // Regex to match forbidden write statements (case-insensitive, at start of line ignoring whitespace)
              const forbidden =
                /\b(insert|update|delete|drop|alter|create|truncate|replace)\b/i;

              if (forbidden.test(currentQuery.sql)) {
                monaco.editor.setModelMarkers(model, "custom-sql-validation", [
                  {
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: 1,
                    endColumn: 1,
                    message:
                      "Only read (SELECT) queries are allowed. Write operations are not permitted.",
                    severity: monaco.MarkerSeverity.Error,
                  },
                ]);
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
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default HQLPage;
