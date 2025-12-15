import React, { useState, useMemo } from "react";
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
import { AlertTriangle, CircleCheckBig, CircleDashed, Table2, BarChart3 } from "lucide-react";
import { HqlErrorDisplay } from "./HqlErrorDisplay";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChartConfig, ChartConfigState } from "./ChartConfig";
import { HqlChart } from "./HqlChart";

// Cost precision multiplier - costs are stored as integers multiplied by this value
const COST_PRECISION_MULTIPLIER = 1_000_000_000;

type ViewMode = "table" | "chart";

interface QueryResultProps {
  sql: string;
  result: Array<Record<string, any>>;
  loading: boolean;
  error: string | null;
  queryStats: components["schemas"]["ExecuteSqlResponse"];
  enableAdminLinks?: boolean;
}
const HQL_VIEW_MODE_KEY = "hql-view-mode";

function QueryResult({
  sql,
  result,
  loading,
  error,
  queryStats,
  enableAdminLinks = false,
}: QueryResultProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "table";
    const saved = localStorage.getItem(HQL_VIEW_MODE_KEY);
    return saved === "chart" ? "chart" : "table";
  });
  const [chartConfig, setChartConfig] = useState<ChartConfigState | null>(null);

  // Persist view mode to localStorage
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(HQL_VIEW_MODE_KEY, mode);
  };

  const columnKeys = useMemo(() => {
    if (!result || result.length === 0) {
      return [];
    }
    return Object.keys(result[0]);
  }, [result]);

  // Check if any cost-related columns are present in the results
  const hasCostColumn = useMemo(() => {
    const costColumnPatterns = ["cost", "provider_total_cost"];
    return columnKeys.some((key) =>
      costColumnPatterns.some((pattern) =>
        key.toLowerCase().includes(pattern.toLowerCase())
      )
    );
  }, [columnKeys]);

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
          const rowData = info.row.original;

          // Make org_name clickable if organization_id exists (admin only)
          if (
            enableAdminLinks &&
            col === "org_name" &&
            rowData.organization_id
          ) {
            return (
              <Link
                href={`/admin/org-search?q=${encodeURIComponent(rowData.organization_id)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
                onClick={(e) => e.stopPropagation()}
              >
                {String(value)}
              </Link>
            );
          }

          // Make organization_id clickable (admin only)
          if (enableAdminLinks && col === "organization_id" && value) {
            return (
              <Link
                href={`/admin/org-search?q=${encodeURIComponent(String(value))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-600 hover:underline dark:text-blue-400"
                onClick={(e) => e.stopPropagation()}
              >
                {String(value)}
              </Link>
            );
          }

          // Make owner_email clickable (admin only)
          if (enableAdminLinks && col === "owner_email" && value) {
            return (
              <Link
                href={`/admin/org-search?q=${encodeURIComponent(String(value))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-600 hover:underline dark:text-blue-400"
                onClick={(e) => e.stopPropagation()}
              >
                {String(value)}
              </Link>
            );
          }

          // Make stripe_customer_id clickable - opens Stripe dashboard (admin only)
          if (enableAdminLinks && col === "stripe_customer_id" && value) {
            return (
              <Link
                href={`https://dashboard.stripe.com/customers/${String(value)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-600 hover:underline dark:text-blue-400"
                onClick={(e) => e.stopPropagation()}
              >
                {String(value)}
              </Link>
            );
          }

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
      <div className="flex flex-col">
        <StatusBar
          elapsedMilliseconds={queryStats.elapsedMilliseconds}
          rowCount={0}
          size={0}
          rows={[]}
          sql={sql}
          queryLoading={loading}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <div className="rounded-full bg-muted p-3">
            <Table2 size={24} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Query returned 0 rows</p>
          <p className="text-xs text-muted-foreground">
            The query executed successfully but no data matched your criteria.
          </p>
        </div>
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
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />
      {hasCostColumn && (
        <Alert variant="warning" className="mx-4 my-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Cost Values Are Stored as Integers</AlertTitle>
          <AlertDescription>
            Cost values in ClickHouse are stored multiplied by{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs dark:bg-amber-900">
              {COST_PRECISION_MULTIPLIER.toLocaleString()}
            </code>{" "}
            for precision. Divide by this value to get the actual USD cost:
            <code className="mt-1 block rounded bg-slate-100 px-2 py-1 font-mono text-xs dark:bg-slate-800">
              sum(cost) / {COST_PRECISION_MULTIPLIER.toLocaleString()} AS
              total_cost_usd
            </code>
          </AlertDescription>
        </Alert>
      )}
      {viewMode === "table" ? (
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
                          header.getContext()
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
      ) : (
        <div className="flex flex-col gap-4 p-4">
          <ChartConfig
            columns={columnKeys}
            data={result}
            config={chartConfig}
            onConfigChange={setChartConfig}
          />
          {chartConfig && <HqlChart data={result} config={chartConfig} />}
        </div>
      )}
    </div>
  );
}

const StatusBar = ({
  elapsedMilliseconds,
  rowCount,
  size,
  sql,
  queryLoading,
  viewMode,
  onViewModeChange,
}: components["schemas"]["ExecuteSqlResponse"] & {
  sql: string;
  queryLoading: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}) => {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-tremor-brand-subtle bg-background px-4 py-1">
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
      <div className="flex items-center gap-2">
        {/* View mode toggle */}
        <div className="flex items-center rounded-md border border-border bg-muted/50 p-0.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => onViewModeChange("table")}
                >
                  <Table2 size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Table view</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === "chart" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => onViewModeChange("chart")}
                >
                  <BarChart3 size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Chart view</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {!queryLoading && <ExportButton sql={sql} />}
      </div>
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
