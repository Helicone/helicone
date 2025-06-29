import React from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import LoadingAnimation from "@/components/shared/loadingAnimation";

interface QueryResultProps {
  result: Array<Record<string, any>>;
  loading: boolean;
  error: string | null;
}
function QueryResult({ result, loading, error }: QueryResultProps) {
  if (error) {
    return <div className="p-4 text-center text-muted-foreground">{error}</div>;
  }

  if (!result || result.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No results found.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <LoadingAnimation />
      </div>
    );
  }

  const columns = Object.keys(result[0]);

  return (
    <Table className="text-left text-sm">
      <TableHeader className="sticky top-0 z-10 bg-muted">
        <TableRow>
          <TableHead className="border-b border-border px-2 py-2 font-semibold text-muted-foreground">
            #
          </TableHead>
          {columns.map((col) => (
            <TableHead
              key={col}
              className="whitespace-nowrap border-b border-border px-2 py-2 font-semibold text-muted-foreground"
            >
              {col}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {result.map((row, i) => (
          <TableRow key={i} className="even:bg-muted/50">
            <TableCell className="border-b border-border px-2 py-1 text-xs text-muted-foreground">
              {i + 1}
            </TableCell>
            {columns.map((col) => (
              <TableCell
                key={col}
                className="max-w-[200px] truncate whitespace-nowrap border-b border-border px-2 py-1"
                title={
                  typeof row[col] === "object" && row[col] !== null
                    ? JSON.stringify(row[col])
                    : (row[col] ?? "")
                }
              >
                {typeof row[col] === "object" && row[col] !== null
                  ? JSON.stringify(row[col])
                  : (row[col] ?? "")}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default QueryResult;
