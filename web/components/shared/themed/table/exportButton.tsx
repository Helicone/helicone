import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logger } from "@/lib/telemetry/logger";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Papa from "papaparse";
import { useState } from "react";
import { LuDownload } from "react-icons/lu";
import { clsx } from "../../clsx";
import useNotification from "../../notification/useNotification";
import ThemedModal from "../themedModal";
import { MAX_EXPORT_ROWS } from "@/lib/constants";

interface ExportButtonProps<T> {
  rows: T[];
  fetchRows?: () => Promise<T[]>;
  format?: "CSV" | "JSONL";
  className?: string;
}

export default function ExportButton<T>({
  rows,
  fetchRows,
  format: initialFormat = "CSV",
}: ExportButtonProps<T>) {
  const [format, setFormat] = useState(initialFormat);
  const [open, setOpen] = useState(false);
  const [downloadingCSV, setDownloadingCSV] = useState(false);

  const { setNotification } = useNotification();

  const download = async () => {
    setDownloadingCSV(true);
    try {
      let dataToExport = rows;
      if (fetchRows) {
        dataToExport = await fetchRows();
      }

      let blob;
      if (format === "CSV") {
        // Preprocess the rows to handle nested objects
        const processedRows = dataToExport.map((row: any) => {
          const newRow: Record<string, any> = {};
          for (const key in row) {
            if (row[key] !== null && typeof row[key] === "object") {
              newRow[key] = JSON.stringify(row[key]);
            } else {
              newRow[key] = row[key];
            }
          }
          return newRow;
        });

        // Convert JSON data to CSV
        const csv = Papa.unparse(processedRows);
        // Create a blob with the CSV data
        blob = new Blob([csv], { type: "text/csv" });
      } else {
        const jsonl = dataToExport.map((row) => JSON.stringify(row)).join("\n");
        blob = new Blob([jsonl], { type: "application/x-ndjson" });
      }

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `data.${format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setNotification(`${format} downloaded successfully!`, "success");
    } catch (error) {
      logger.error({ error, format }, `Error exporting ${format}`);
      setNotification(`Error exporting ${format}. Please try again.`, "error");
    } finally {
      setDownloadingCSV(false);
      setOpen(false);
    }
  };

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
                Exporting is limited to {MAX_EXPORT_ROWS} rows due to the huge
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
              onValueChange={(value) => setFormat(value as "CSV" | "JSONL")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CSV">CSV</SelectItem>
                <SelectItem value="JSONL">JSONL</SelectItem>
              </SelectContent>
            </Select>

            <p className="sm:text-md text-sm text-gray-500">
              Exporting may take a while depending on the amount of data. Please
              do not close this modal once export is started.
            </p>
          </div>

          <div className="flex w-full justify-end space-x-4 text-sm">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex flex-row items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:border-gray-700 dark:bg-black dark:text-gray-100 dark:hover:bg-gray-900 dark:hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              className="flex items-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
              onClick={download}
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
            </button>
          </div>
        </div>
      </ThemedModal>
    </TooltipProvider>
  );
}
