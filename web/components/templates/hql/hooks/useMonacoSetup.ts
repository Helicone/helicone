import { useEffect, useRef } from "react";
import { useMonaco } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import type * as monaco from "monaco-editor";
import { components } from "@/lib/clients/jawnTypes/public";
import {
  ALL_KEYWORDS,
  getTableNames,
  getTableNamesSet,
  parseSqlAndFindTableNameAndAliases,
} from "../constants";

interface UseMonacoSetupProps {
  clickhouseSchemas:
    | {
        table_name: string;
        columns: components["schemas"]["ClickHouseTableColumn"][];
      }[]
    | undefined;
  currentQuery: {
    sql: string;
  };
}

export function useMonacoSetup({
  clickhouseSchemas,
  currentQuery,
}: UseMonacoSetupProps) {
  const monacoInstance = useMonaco();
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!monacoInstance || !clickhouseSchemas) return;

    const schemaTableNames = getTableNames(clickhouseSchemas);
    const schemaTableNamesSet = getTableNamesSet(clickhouseSchemas);
    const schemaTableNames = getTableNames(tableSchema);
    const schemaTableNamesSet = getTableNamesSet(tableSchema);

    const disposable = monacoInstance.languages.registerCompletionItemProvider(
      "*",
      {
        provideCompletionItems: (model, position) => {
          let suggestions: monaco.languages.CompletionItem[] = [];

          const word = model.getWordUntilPosition(position);
          const range = new monacoInstance.Range(
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

          if (
            lastTokenBeforeSpace &&
            /from|join|update|into/i.test(lastTokenBeforeSpace)
          ) {
            suggestions.push(
              ...schemaTableNames.map((table_name) => ({
                label: table_name,
                kind: monacoInstance.languages.CompletionItemKind.Field,
                insertText: table_name,
                range,
              })),
            );
          }

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
                      kind: monacoInstance.languages.CompletionItemKind.Field,
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
              kind: monacoInstance.languages.CompletionItemKind.Keyword,
              insertText: keyword,
              detail: keyword.includes("(")
                ? "ClickHouse function"
                : "SQL keyword",
              sortText: "1" + keyword,
              range,
            })),
          );

          const seen = new Set();
          suggestions = suggestions.filter((s) => {
            if (seen.has(s.insertText)) return false;
            seen.add(s.insertText);
            return true;
          });

          return { suggestions };
        },
      },
    );

    return () => disposable.dispose();
  }, [monacoInstance, clickhouseSchemas, currentQuery.sql]);

  return { editorRef, monacoInstance };
}
