import React, { useState, useEffect, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  CellContext,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ThemedModal from "@/components/shared/themed/themedModal";
import { MAX_EXPORT_CSV } from "@/lib/constants";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { LuDownload } from "react-icons/lu";
import { clsx } from "@/components/shared/clsx";
import { useMutation } from "@tanstack/react-query";
import { $JAWN_API } from "@/lib/clients/jawn";
import { components } from "@/lib/clients/jawnTypes/public";
import useNotification from "@/components/shared/notification/useNotification";
import { CircleCheckBig, CircleDashed } from "lucide-react";
import { HqlErrorDisplay } from "./HqlErrorDisplay";

interface QueryResultProps {
  sql: string;
  result: Array<Record<string, any>>;
  loading: boolean;
  error: string | null;
  queryStats: components["schemas"]["ExecuteSqlResponse"];
}
function QueryResult({
  sql,
  result,
  loading,
  error,
  queryStats,
}: QueryResultProps) {
  const columnKeys = useMemo(() => {
    if (!result || result.length === 0) {
      return [];
    }
    return Object.keys(result[0]);
  }, [result]);

  const columnDefs = useMemo<ColumnDef<Record<string, any>>[]>(() => {
    const indexCol: ColumnDef<Record<string, any>> = {
      id: "__rowNum",
      header: "#",
      cell: (info) => info.row.index + 1,
    };

    const dynamicCols: ColumnDef<Record<string, any>>[] = columnKeys.map(
      (col) => ({
        header: col,
        accessorKey: col,
        cell: (info: CellContext<Record<string, any>, unknown>) => {
          const value = info.getValue();
          if (typeof value === "object" && value !== null) {
            try {
              return JSON.stringify(value);
            } catch (_e) {
              return String(value);
            }
          }
          return value as any;
        },
      }),
    );

    return [indexCol, ...dynamicCols];
  }, [columnKeys]);

  const table = useReactTable({
    data: result ?? [],
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
  });

  if (error) {
    return (
      <div className="p-4">
        <HqlErrorDisplay error={error} />
      </div>
    );
  }

  if (!result || result.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No results found.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <StatusBar
        elapsedMilliseconds={queryStats.elapsedMilliseconds}
        rowCount={queryStats.rowCount}
        size={queryStats.size}
        rows={result}
        sql={sql}
        queryLoading={loading}
      />
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const StatusBar = ({
  elapsedMilliseconds,
  rowCount,
  size,
  sql,
  queryLoading,
}: components["schemas"]["ExecuteSqlResponse"] & {
  sql: string;
  queryLoading: boolean;
}) => {
  return (
    <div className="flex items-center justify-between border-b border-tremor-brand-subtle bg-background px-4 py-1">
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <span className="flex items-center">
          {queryLoading ? (
            <CircleDashed className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <CircleCheckBig className="mr-2 h-5 w-5 text-green-500" />
          )}
          Elapsed: {queryLoading ? "?" : elapsedMilliseconds} ms
        </span>
        <span>
          Read: {queryLoading ? "?" : rowCount} rows (
          {queryLoading ? "?" : size} bytes)
        </span>
      </div>
      {!queryLoading && <ExportButton sql={sql} />}
    </div>
  );
};

interface ExportButtonProps {
  sql: string;
}

function ExportButton({ sql }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<"CSV">("CSV");
  const [downloadingCSV, setDownloadingCSV] = useState(false);
  const notify = useNotification();

  const { mutate: download } = useMutation({
    mutationFn: async (sql: string) => {
      const response = await $JAWN_API.POST("/v1/helicone-sql/download", {
        body: { sql },
      });
      return response;
    },
    onSuccess: (data) => {
      setDownloadingCSV(false);
      const url = data.data?.data;
      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.download = ""; // Let the server suggest the filename, or set one here
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    onError: () => {
      setDownloadingCSV(false);
      notify.setNotification("Failed to export CSV", "error");
    },
  });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="none"
            size="none"
            className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => setOpen(true)}
          >
            <LuDownload className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Export data</TooltipContent>
      </Tooltip>

      <ThemedModal open={open} setOpen={setOpen}>
        <div className="flex w-full min-w-[350px] max-w-sm flex-col space-y-4 sm:space-y-8">
          <div className="flex flex-col space-y-8">
            <div className="flex flex-col space-y-4">
              <p className="text-md font-semibold text-gray-900 dark:text-gray-100 sm:text-lg">
                Export {format}
              </p>
              <p className="sm:text-md text-sm text-gray-500">
                Exporting is limited to {MAX_EXPORT_CSV} rows due to the huge
                amounts of data in the requests. For larger exports, please use
                our{" "}
                <Link
                  href="https://docs.helicone.ai/helicone-api/getting-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-600 underline"
                >
                  API
                </Link>
                .
              </p>
            </div>

            <Select
              value={format}
              onValueChange={(value) => setFormat(value as "CSV")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CSV">CSV</SelectItem>
              </SelectContent>
            </Select>

            <p className="sm:text-md text-sm text-gray-500">
              Exporting may take a while depending on the amount of data. Please
              do not close this modal once export is started.
            </p>
          </div>

          <div className="flex w-full justify-end space-x-4 text-sm">
            <Button
              variant="none"
              size="none"
              onClick={() => setOpen(false)}
              disabled={downloadingCSV}
            >
              Cancel
            </Button>
            <Button
              className="flex items-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
              onClick={() => download(sql)}
            >
              {downloadingCSV ? (
                <>
                  <ArrowPathIcon
                    className={clsx("mr-2 inline h-5 w-5 animate-spin")}
                  />
                  Exporting
                </>
              ) : (
                <p>Export</p>
              )}
            </Button>
          </div>
        </div>
      </ThemedModal>
    </TooltipProvider>
  );
}

export default QueryResult;
