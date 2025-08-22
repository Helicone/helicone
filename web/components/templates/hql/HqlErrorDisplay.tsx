import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, XCircle } from "lucide-react";
import { HqlErrorCode, parseHqlError } from "@/lib/api/hql/errorTypes";

interface HqlErrorDisplayProps {
  error: string | null;
  className?: string;
}

interface ErrorDisplay {
  title: string;
  description: string;
  severity: "error" | "warning" | "info";
  icon: React.ComponentType<{ className?: string }>;
  suggestions?: string[];
}

// Map error codes to user-friendly display information
const ERROR_DISPLAY_MAP: Record<
  HqlErrorCode,
  Omit<ErrorDisplay, "description">
> = {
  // SQL Validation Errors
  [HqlErrorCode.INVALID_STATEMENT]: {
    title: "Invalid SQL Statement",
    severity: "error",
    icon: XCircle,
    suggestions: [
      "Only SELECT statements are allowed",
      "Remove any INSERT, UPDATE, DELETE, or DDL statements",
    ],
  },
  [HqlErrorCode.INVALID_TABLE]: {
    title: "Invalid Table",
    severity: "error",
    icon: XCircle,
    suggestions: [
      "Check the table name in your query",
      "Only authorized tables can be queried",
    ],
  },
  [HqlErrorCode.SYNTAX_ERROR]: {
    title: "SQL Syntax Error",
    severity: "warning",
    icon: AlertTriangle,
    suggestions: [
      "Check your SQL syntax",
      "Verify all keywords are spelled correctly",
      "Ensure quotes and parentheses are balanced",
    ],
  },
  [HqlErrorCode.SQL_INJECTION_ATTEMPT]: {
    title: "Security Violation",
    severity: "error",
    icon: XCircle,
  },

  // Query Execution Errors
  [HqlErrorCode.QUERY_TIMEOUT]: {
    title: "Query Timeout",
    severity: "warning",
    icon: AlertTriangle,
    suggestions: [
      "Add more specific filters to reduce data",
      "Use LIMIT to restrict results",
      "Optimize your WHERE conditions",
    ],
  },
  [HqlErrorCode.MEMORY_LIMIT_EXCEEDED]: {
    title: "Memory Limit Exceeded",
    severity: "warning",
    icon: AlertTriangle,
    suggestions: [
      "Reduce the number of columns selected",
      "Add date range filters",
      "Use aggregations instead of raw data",
    ],
  },
  [HqlErrorCode.ROW_LIMIT_EXCEEDED]: {
    title: "Too Many Rows",
    severity: "warning",
    icon: AlertTriangle,
    suggestions: [
      "Add more WHERE conditions",
      "Use a smaller date range",
      "Apply LIMIT to your query",
    ],
  },
  [HqlErrorCode.RESULT_LIMIT_EXCEEDED]: {
    title: "Result Set Too Large",
    severity: "warning",
    icon: AlertTriangle,
    suggestions: [
      "Add a LIMIT clause (max 10,000 rows)",
      "Export to CSV for larger datasets",
    ],
  },
  [HqlErrorCode.EXECUTION_FAILED]: {
    title: "Query Execution Failed",
    severity: "error",
    icon: XCircle,
  },

  // Data Errors
  [HqlErrorCode.NO_DATA_RETURNED]: {
    title: "No Data Found",
    severity: "info",
    icon: AlertCircle,
    suggestions: [
      "Adjust your filters",
      "Check the date range",
      "Verify the table contains data",
    ],
  },
  [HqlErrorCode.SCHEMA_FETCH_FAILED]: {
    title: "Schema Load Failed",
    severity: "error",
    icon: XCircle,
  },

  // Saved Query Errors
  [HqlErrorCode.QUERY_NOT_FOUND]: {
    title: "Query Not Found",
    severity: "warning",
    icon: AlertTriangle,
  },
  [HqlErrorCode.QUERY_NAME_EXISTS]: {
    title: "Duplicate Query Name",
    severity: "warning",
    icon: AlertTriangle,
    suggestions: ["Choose a different name for your query"],
  },
  [HqlErrorCode.QUERY_ACCESS_DENIED]: {
    title: "Access Denied",
    severity: "error",
    icon: XCircle,
  },

  // Validation Errors
  [HqlErrorCode.MISSING_QUERY_ID]: {
    title: "Missing Query ID",
    severity: "error",
    icon: XCircle,
  },
  [HqlErrorCode.MISSING_QUERY_NAME]: {
    title: "Query Name Required",
    severity: "warning",
    icon: AlertTriangle,
    suggestions: ["Enter a name for your query"],
  },
  [HqlErrorCode.MISSING_QUERY_SQL]: {
    title: "SQL Required",
    severity: "warning",
    icon: AlertTriangle,
    suggestions: ["Enter a SQL query"],
  },
  [HqlErrorCode.QUERY_NAME_TOO_LONG]: {
    title: "Query Name Too Long",
    severity: "warning",
    icon: AlertTriangle,
    suggestions: ["Use a shorter name (max 255 characters)"],
  },

  // Export Errors
  [HqlErrorCode.CSV_UPLOAD_FAILED]: {
    title: "CSV Export Failed",
    severity: "error",
    icon: XCircle,
    suggestions: ["Try again", "Check your network connection"],
  },
  [HqlErrorCode.CSV_URL_NOT_RETURNED]: {
    title: "Export URL Error",
    severity: "error",
    icon: XCircle,
  },

  // Feature Access Errors
  [HqlErrorCode.FEATURE_NOT_ENABLED]: {
    title: "Feature Not Available",
    severity: "error",
    icon: XCircle,
    suggestions: ["Contact your administrator to enable HQL access"],
  },

  // Generic Errors
  [HqlErrorCode.UNEXPECTED_ERROR]: {
    title: "Unexpected Error",
    severity: "error",
    icon: XCircle,
    suggestions: ["Try again", "If the problem persists, contact support"],
  },
};

const getErrorDetails = (errorString: string): ErrorDisplay => {
  const hqlError = parseHqlError(errorString);

  // If we have a known error code, use the mapping
  if (hqlError.code && ERROR_DISPLAY_MAP[hqlError.code]) {
    const display = ERROR_DISPLAY_MAP[hqlError.code];
    return {
      ...display,
      description: hqlError.details || hqlError.message,
    };
  }

  // Fallback for unknown errors
  return {
    title: "Query Error",
    description: hqlError.message,
    severity: "error",
    icon: XCircle,
  };
};

export function HqlErrorDisplay({ error, className }: HqlErrorDisplayProps) {
  if (!error) return null;

  const {
    title,
    description,
    severity,
    icon: Icon,
    suggestions,
  } = getErrorDetails(error);

  return (
    <Alert
      variant={
        severity === "error"
          ? "destructive"
          : severity === "info"
            ? "default"
            : "default"
      }
      className={className}
    >
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>{description}</p>
        {suggestions && suggestions.length > 0 && (
          <div className="mt-3">
            <p className="mb-1 text-sm font-medium">Suggestions:</p>
            <ul className="list-inside list-disc space-y-1 text-sm opacity-90">
              {suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

export default HqlErrorDisplay;
