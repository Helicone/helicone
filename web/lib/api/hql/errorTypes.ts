/**
 * Frontend HQL Error Types
 * This is a lightweight version for parsing and displaying errors from the API.
 * The backend has the full error system with creation and validation logic.
 */

// Error codes must match backend definitions
export enum HqlErrorCode {
  // SQL Validation Errors
  INVALID_STATEMENT = "HQL_INVALID_STATEMENT",
  INVALID_TABLE = "HQL_INVALID_TABLE",
  SYNTAX_ERROR = "HQL_SYNTAX_ERROR",
  SQL_INJECTION_ATTEMPT = "HQL_SQL_INJECTION_ATTEMPT",
  
  // Query Execution Errors
  QUERY_TIMEOUT = "HQL_QUERY_TIMEOUT",
  MEMORY_LIMIT_EXCEEDED = "HQL_MEMORY_LIMIT_EXCEEDED",
  ROW_LIMIT_EXCEEDED = "HQL_ROW_LIMIT_EXCEEDED",
  RESULT_LIMIT_EXCEEDED = "HQL_RESULT_LIMIT_EXCEEDED",
  EXECUTION_FAILED = "HQL_EXECUTION_FAILED",
  
  // Data Errors
  NO_DATA_RETURNED = "HQL_NO_DATA_RETURNED",
  SCHEMA_FETCH_FAILED = "HQL_SCHEMA_FETCH_FAILED",
  
  // Saved Query Errors
  QUERY_NOT_FOUND = "HQL_QUERY_NOT_FOUND",
  QUERY_NAME_EXISTS = "HQL_QUERY_NAME_EXISTS",
  QUERY_ACCESS_DENIED = "HQL_QUERY_ACCESS_DENIED",
  
  // Validation Errors
  MISSING_QUERY_ID = "HQL_MISSING_QUERY_ID",
  MISSING_QUERY_NAME = "HQL_MISSING_QUERY_NAME",
  MISSING_QUERY_SQL = "HQL_MISSING_QUERY_SQL",
  QUERY_NAME_TOO_LONG = "HQL_QUERY_NAME_TOO_LONG",
  
  // Export Errors
  CSV_UPLOAD_FAILED = "HQL_CSV_UPLOAD_FAILED",
  CSV_URL_NOT_RETURNED = "HQL_CSV_URL_NOT_RETURNED",
  
  // Feature Access Errors
  FEATURE_NOT_ENABLED = "HQL_FEATURE_NOT_ENABLED",
  
  // Generic Errors
  UNEXPECTED_ERROR = "HQL_UNEXPECTED_ERROR",
}

// Parsed error structure from API responses
export interface HqlError {
  code?: HqlErrorCode;
  message: string;
  details?: string;
}

// Parse error string to extract HQL error structure
export function parseHqlError(errorString: string): HqlError {
  // Try to extract error code from string if it follows pattern
  const codeMatch = errorString.match(/\[(HQL_[A-Z_]+)\]/);
  if (codeMatch) {
    const code = codeMatch[1] as HqlErrorCode;
    const message = errorString.replace(/\[HQL_[A-Z_]+\]\s*/, '');
    return { code, message };
  }
  
  // Fallback to parsing error message patterns
  return { message: errorString };
}