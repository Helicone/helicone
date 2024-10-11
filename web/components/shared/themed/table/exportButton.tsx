import { ArrowDownTrayIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Papa from "papaparse";
import { useState } from "react";
import { clsx } from "../../clsx";
import useNotification from "../../notification/useNotification";
import ThemedModal from "../themedModal";
import { Button } from "@/components/ui/button";

interface ExportButtonProps<T> {
  rows: T[];
  fetchRows?: () => Promise<T[]>;
  format?: "CSV" | "JSONL";
  className?: string;
}

export default function ExportButton<T>(props: ExportButtonProps<T>) {
  const { rows, fetchRows, format: initialFormat = "CSV", className } = props;
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
      console.error(`Error exporting ${format}:`, error);
      setNotification(`Error exporting ${format}. Please try again.`, "error");
    } finally {
      setDownloadingCSV(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        className={clsx("flex items-center gap-2", className)}
        size="xs"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
      </Button>

      <ThemedModal open={open} setOpen={setOpen}>
        <div className="flex flex-col space-y-4 sm:space-y-8 min-w-[350px] max-w-sm w-full">
          <div className="flex flex-col space-y-8">
            <div className="flex flex-col space-y-4">
              <p className="text-md sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                Export {format}
              </p>
              <p className="text-sm sm:text-md text-gray-500">
                Exporting is limited to 500 rows due to the huge amounts of data
                in the requests. For larger exports, please use our{" "}
                <Link
                  href="https://docs.helicone.ai/helicone-api/getting-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold text-blue-600"
                >
                  API
                </Link>
                .
              </p>
            </div>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as "CSV" | "JSONL")}
              className="mt-4 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="CSV">CSV</option>
              <option value="JSONL">JSONL</option>
            </select>
            <p className="text-sm sm:text-md text-gray-500">
              Export may take a lot of time. Please do not close this modal once
              export is started.
            </p>
          </div>

          <div className="w-full flex justify-end text-sm space-x-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
            >
              Cancel
            </button>
            <button
              className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={download}
            >
              {downloadingCSV ? (
                <>
                  <ArrowPathIcon
                    className={clsx("h-5 w-5 inline animate-spin mr-2")}
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
    </>
  );
}
