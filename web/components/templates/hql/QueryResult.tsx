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
}
function QueryResult({ result, loading }: QueryResultProps) {
  if (!result || result.length === 0) {
    return (
      <div className="p-4 text-muted-foreground text-center">
        No results found.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-muted-foreground text-center">
        <LoadingAnimation />
      </div>
    );
  }

  const columns = Object.keys(result[0]);

  return (
    <Table className="text-sm text-left">
      <TableHeader className="sticky top-0 bg-muted z-10">
        <TableRow>
          <TableHead className="px-2 py-2 border-b border-border text-muted-foreground font-semibold">
            #
          </TableHead>
          {columns.map((col) => (
            <TableHead
              key={col}
              className="px-2 py-2 border-b border-border text-muted-foreground font-semibold whitespace-nowrap"
            >
              {col}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {result.map((row, i) => (
          <TableRow key={i} className="even:bg-muted/50">
            <TableCell className="px-2 py-1 border-b border-border text-muted-foreground text-xs">
              {i + 1}
            </TableCell>
            {columns.map((col) => (
              <TableCell
                key={col}
                className="px-2 py-1 border-b border-border whitespace-nowrap max-w-[200px] truncate"
                title={
                  typeof row[col] === "object" && row[col] !== null
                    ? JSON.stringify(row[col])
                    : row[col] ?? ""
                }
              >
                {typeof row[col] === "object" && row[col] !== null
                  ? JSON.stringify(row[col])
                  : row[col] ?? ""}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default QueryResult;
