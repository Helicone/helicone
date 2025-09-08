import type { editor as MonacoEditor } from "monaco-editor";

import {
  SQL_WRITE_OPERATIONS_REGEX,
  SQL_VALIDATION_ERROR_MESSAGE,
} from "../config";

export function validateSqlQuery(
  sql: string,
  model: MonacoEditor.ITextModel,
  monacoInstance: typeof import("monaco-editor"),
) {
  if (SQL_WRITE_OPERATIONS_REGEX.test(sql)) {
    monacoInstance.editor.setModelMarkers(model, "custom-sql-validation", [
      {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
        message: SQL_VALIDATION_ERROR_MESSAGE,
        severity: monacoInstance.MarkerSeverity.Error,
      },
    ]);
  } else {
    monacoInstance.editor.setModelMarkers(model, "custom-sql-validation", []);
  }
}
