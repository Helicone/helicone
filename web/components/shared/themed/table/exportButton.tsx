import { ArrowDownTrayIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Papa from "papaparse";
import { useState } from "react";
import { clsx } from "../../clsx";
import useNotification from "../../notification/useNotification";
import ThemedModal from "../themedModal";

interface ExportButtonProps<T> {
  rows: T[];
}

export default function ExportButton<T>(props: ExportButtonProps<T>) {
  const { rows } = props;

  const [open, setOpen] = useState(false);
  const [downloadingCSV, setDownloadingCSV] = useState(false);

  const { setNotification } = useNotification();

  const csvDownload = () => {
    setDownloadingCSV(true);
    // Convert JSON data to CSV
    const csv = Papa.unparse(rows);
    // Create a blob with the CSV data
    const blob = new Blob([csv], { type: "text/csv" });
    // Create a download link and click it to start the download
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadingCSV(false);
    setOpen(false);
    setNotification("CSV downloaded successfully!", "success");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
      >
        <ArrowDownTrayIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block">
          Export
        </p>
      </button>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="flex flex-col space-y-4 sm:space-y-8 min-w-[350px] max-w-sm w-full">
          <div className="flex flex-col space-y-8">
            <div className="flex flex-col space-y-4">
              <p className="text-md sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                Export CSV
              </p>
              <p className="text-sm sm:text-md text-gray-500">
                Exporting by CSV is limited to 500 rows due to the huge amounts
                of data in the requests. For larger exports, please use our{" "}
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
              onClick={csvDownload}
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
