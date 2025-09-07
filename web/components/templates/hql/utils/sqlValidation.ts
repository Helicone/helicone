import * as monaco from "monaco-editor";

import { SQL_WRITE_OPERATIONS_REGEX, SQL_VALIDATION_ERROR_MESSAGE } from "../config";

export function validateSqlQuery(
  sql: string,
  model: monaco.editor.ITextModel,
  monacoInstance: typeof monaco,
) {
  if (SQL_WRITE_OPERATIONS_REGEX.test(sql)) {
    monacoInstance.editor.setModelMarkers(model, "custom-sql-validation", [
      {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
        message: SQL_VALIDATION_ERROR_MESSAGE,
        severity: monaco.MarkerSeverity.Error,
      },
    ]);
  } else {
    monacoInstance.editor.setModelMarkers(model, "custom-sql-validation", []);
  }
}


