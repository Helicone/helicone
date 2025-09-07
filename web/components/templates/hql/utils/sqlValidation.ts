import { editor } from "monaco-editor";
import * as monaco from "monaco-editor";
import { SQL_WRITE_OPERATIONS_REGEX, SQL_VALIDATION_ERROR_MESSAGE } from "../config";

export function validateSqlQuery(
  value: string,
  model: editor.ITextModel | null,
  monacoInstance: typeof monaco
): void {
  if (!model) return;

  const hasWriteOperations = SQL_WRITE_OPERATIONS_REGEX.test(value);
  
  if (hasWriteOperations) {
    monacoInstance.editor.setModelMarkers(
      model,
      "custom-sql-validation",
      [{
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
        message: SQL_VALIDATION_ERROR_MESSAGE,
        severity: monacoInstance.MarkerSeverity.Error,
      }]
    );
  } else {
    monacoInstance.editor.setModelMarkers(
      model,
      "custom-sql-validation",
      []
    );
  }
}

export function isReadOnlyQuery(sql: string): boolean {
  return !SQL_WRITE_OPERATIONS_REGEX.test(sql);
}