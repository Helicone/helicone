import { err, Result } from "../../packages/common/result";

/**
 * Backend HQL Error System
 * This defines all error codes and handling for the HQL feature.
 * The frontend has a separate, lighter-weight version for parsing and display.
 */

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

export interface HqlError {
  code: HqlErrorCode;
  message: string;
  details?: string;
  statusCode?: number;
}

export const HqlErrorMessages: Record<HqlErrorCode, string> = {
  [HqlErrorCode.INVALID_STATEMENT]: "Only SELECT statements are allowed",
  [HqlErrorCode.INVALID_TABLE]: "Table is not allowed for querying",
  [HqlErrorCode.SYNTAX_ERROR]: "SQL syntax error",
  [HqlErrorCode.SQL_INJECTION_ATTEMPT]: "Query contains forbidden keywords",
  
  [HqlErrorCode.QUERY_TIMEOUT]: "Query execution timeout (30 seconds). Please optimize your query.",
  [HqlErrorCode.MEMORY_LIMIT_EXCEEDED]: "Query exceeded memory limit. Please reduce the data scope.",
  [HqlErrorCode.ROW_LIMIT_EXCEEDED]: "Query attempted to read too many rows. Please add more filters.",
  [HqlErrorCode.RESULT_LIMIT_EXCEEDED]: "Query result exceeded maximum rows (10,000). Please add LIMIT clause.",
  [HqlErrorCode.EXECUTION_FAILED]: "Query execution failed",
  
  [HqlErrorCode.NO_DATA_RETURNED]: "No data returned from query",
  [HqlErrorCode.SCHEMA_FETCH_FAILED]: "Failed to fetch database schema",
  
  [HqlErrorCode.QUERY_NOT_FOUND]: "Query not found or access denied",
  [HqlErrorCode.QUERY_NAME_EXISTS]: "A query with this name already exists",
  [HqlErrorCode.QUERY_ACCESS_DENIED]: "Access denied to this query",
  
  [HqlErrorCode.MISSING_QUERY_ID]: "Query ID is required",
  [HqlErrorCode.MISSING_QUERY_NAME]: "Query name is required",
  [HqlErrorCode.MISSING_QUERY_SQL]: "Query SQL is required",
  [HqlErrorCode.QUERY_NAME_TOO_LONG]: "Query name must be less than 255 characters",
  
  [HqlErrorCode.CSV_UPLOAD_FAILED]: "Failed to upload CSV",
  [HqlErrorCode.CSV_URL_NOT_RETURNED]: "CSV upload succeeded but no URL was returned",
  
  [HqlErrorCode.FEATURE_NOT_ENABLED]: "Access to HQL feature is not enabled for your organization",
  
  [HqlErrorCode.UNEXPECTED_ERROR]: "An unexpected error occurred",
};

export const StatusCodeMap: Partial<Record<HqlErrorCode, number>> = {
  [HqlErrorCode.INVALID_STATEMENT]: 400,
  [HqlErrorCode.INVALID_TABLE]: 400,
  [HqlErrorCode.SYNTAX_ERROR]: 400,
  [HqlErrorCode.SQL_INJECTION_ATTEMPT]: 400,
  [HqlErrorCode.MISSING_QUERY_ID]: 400,
  [HqlErrorCode.MISSING_QUERY_NAME]: 400,
  [HqlErrorCode.MISSING_QUERY_SQL]: 400,
  [HqlErrorCode.QUERY_NAME_TOO_LONG]: 400,
  
  [HqlErrorCode.FEATURE_NOT_ENABLED]: 403,
  [HqlErrorCode.QUERY_ACCESS_DENIED]: 403,
  
  [HqlErrorCode.QUERY_NOT_FOUND]: 404,
  [HqlErrorCode.NO_DATA_RETURNED]: 404,
  
  [HqlErrorCode.QUERY_NAME_EXISTS]: 409,
  
  [HqlErrorCode.QUERY_TIMEOUT]: 503,
  [HqlErrorCode.MEMORY_LIMIT_EXCEEDED]: 503,
  [HqlErrorCode.ROW_LIMIT_EXCEEDED]: 503,
  [HqlErrorCode.RESULT_LIMIT_EXCEEDED]: 503,
  
  [HqlErrorCode.EXECUTION_FAILED]: 500,
  [HqlErrorCode.SCHEMA_FETCH_FAILED]: 500,
  [HqlErrorCode.CSV_UPLOAD_FAILED]: 500,
  [HqlErrorCode.CSV_URL_NOT_RETURNED]: 500,
  [HqlErrorCode.UNEXPECTED_ERROR]: 500,
};

export function createHqlError(
  code: HqlErrorCode,
  details?: string
): HqlError {
  return {
    code,
    message: HqlErrorMessages[code],
    details,
    statusCode: StatusCodeMap[code] || 500,
  };
}

export function hqlError<T>(
  code: HqlErrorCode,
  details?: string
): Result<T, HqlError> {
  return err(createHqlError(code, details));
}

export function parseClickhouseError(error: string): HqlErrorCode {
  if (error.includes('max_execution_time')) {
    return HqlErrorCode.QUERY_TIMEOUT;
  }
  if (error.includes('max_memory_usage')) {
    return HqlErrorCode.MEMORY_LIMIT_EXCEEDED;
  }
  if (error.includes('max_rows_to_read')) {
    return HqlErrorCode.ROW_LIMIT_EXCEEDED;
  }
  if (error.includes('max_result_rows')) {
    return HqlErrorCode.RESULT_LIMIT_EXCEEDED;
  }
  return HqlErrorCode.EXECUTION_FAILED;
}

export function parseDatabaseError(error: string): HqlErrorCode {
  if (error.includes('unique constraint')) {
    return HqlErrorCode.QUERY_NAME_EXISTS;
  }
  return HqlErrorCode.UNEXPECTED_ERROR;
}