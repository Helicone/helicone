import React, { useState, useEffect, useMemo } from "react";
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
        link.download = "";
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
            onClick={() => {
              if (downloadingCSV) return;
              setDownloadingCSV(true);
              download(sql);
            }}
            aria-label="Export CSV"
            title="Export CSV"
          >
            {downloadingCSV ? (
              <ArrowPathIcon className={clsx("h-4 w-4 animate-spin")} />
            ) : (
              <LuDownload className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Export data</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default QueryResult;
