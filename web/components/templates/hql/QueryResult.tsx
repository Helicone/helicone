import React, { useState, useEffect, useMemo } from "react";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import ThemedTable from "@/components/shared/themed/table/themedTable";
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
import { CellContext } from "@tanstack/react-table";
import { components } from "@/lib/clients/jawnTypes/public";
import useNotification from "@/components/shared/notification/useNotification";
import { CircleCheckBig, CircleDashed } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
  const columns = useMemo(() => {
    if (!result || result.length === 0) {
      return [];
    }
    return Object.keys(result[0]);
  }, [result]);

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
      {loading ? (
        <div className="p-4 text-center text-muted-foreground">
          <LoadingAnimation />
        </div>
      ) : (
        <ThemedTable
          id="hql-result"
          defaultData={result}
          defaultColumns={[
            {
              header: "#",
              accessorKey: "__rowNum",
              cell: (info) => info.row.index + 1,
            },
            ...columns.map((col) => ({
              header: col,
              accessorKey: col,
              cell: (info: CellContext<Record<string, any>, unknown>) => {
                const value = info.getValue();
                if (typeof value === "object" && value !== null) {
                  return JSON.stringify(value);
                }
                return value;
              },
            })),
          ]}
          skeletonLoading={false}
          dataLoading={false}
          checkboxMode="never"
          onRowSelect={() => {}}
          onSelectAll={() => {}}
          selectedIds={[]}
          activeColumns={[]}
          setActiveColumns={() => {}}
        />
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
}: components["schemas"]["ExecuteSqlResponse"] & {
  sql: string;
  queryLoading: boolean;
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (queryLoading) {
      setProgress(10);
      interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 200);
    } else if (!queryLoading && progress > 0) {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [queryLoading]);

  return (
    <div className="flex items-center justify-between border-b border-tremor-brand-subtle bg-background px-4 py-1">
      {queryLoading && (
        <Progress
          value={progress}
          className="mr-2 h-1 [&>div]:bg-sky-500 dark:[&>div]:bg-sky-500"
        />
      )}
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
