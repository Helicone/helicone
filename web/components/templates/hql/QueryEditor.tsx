import React, { useCallback, MutableRefObject } from "react";
import { Editor } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import type * as monaco from "monaco-editor";
import { MONACO_EDITOR_OPTIONS } from "./config";
import { validateSqlQuery } from "./utils/sqlValidation";

interface QueryEditorProps {
  sql: string;
  onSqlChange: (value: string) => void;
  onExecute: (sql: string) => void;
  onSave: (query: { id?: string; name: string; sql: string }) => void;
  editorRef: MutableRefObject<MonacoEditor.IStandaloneCodeEditor | null>;
  latestQueryRef: MutableRefObject<{ id?: string; name: string; sql: string }>;
  currentQuery: { id?: string; name: string; sql: string };
}

const QueryEditor: React.FC<QueryEditorProps> = React.memo(
  ({
    sql,
    onSqlChange,
    onExecute,
    onSave,
    editorRef,
    latestQueryRef,
    currentQuery,
  }) => {
    const handleEditorMount = useCallback(
      async (
        editor: MonacoEditor.IStandaloneCodeEditor,
        monacoInstance: typeof monaco,
      ) => {
        editorRef.current = editor;
        const model = editor.getModel();
        if (!model) return;

        validateSqlQuery(sql, model, monacoInstance);

        editor.onDidChangeModelContent(() => {
          validateSqlQuery(sql, model, monacoInstance);
        });

        editor.addCommand(
          monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter,
          () => {
            onExecute(latestQueryRef.current.sql);
          },
        );

        editor.addCommand(
          monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS,
          () => {
            onSave(latestQueryRef.current);
          },
        );
      },
      [sql, editorRef, latestQueryRef, onExecute, onSave],
    );

    const handleEditorChange = useCallback(
      (value: string | undefined) => {
        const newValue = value ?? "";
        onSqlChange(newValue);

        if (value && editorRef.current) {
          const model = editorRef.current.getModel();
          if (
            model &&
            typeof window !== "undefined" &&
            (window as any).monaco
          ) {
            validateSqlQuery(value, model, (window as any).monaco);
          }
        }
      },
      [onSqlChange, editorRef],
    );

    return (
      <Editor
        defaultLanguage="sql"
        defaultValue={sql}
        options={MONACO_EDITOR_OPTIONS}
        onMount={handleEditorMount}
        onChange={handleEditorChange}
      />
    );
  },
);

QueryEditor.displayName = "QueryEditor";

export default QueryEditor;
