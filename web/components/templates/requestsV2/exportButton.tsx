import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Papa from "papaparse";
import { useState } from "react";
import ThemedModal from "../../shared/themed/themedModal";
import { NormalizedRequest } from "./builder/abstractRequestBuilder";

interface ExportButtonProps<T> {
  rows: T[];
}

const notificationMethods = [
  { id: "filtered", title: "Only selected columns", filtered: true },
  { id: "all", title: "All event properties", filtered: false },
];

export default function ExportButton<T>(props: ExportButtonProps<T>) {
  const { rows } = props;

  const [open, setOpen] = useState(false);
  const [downloadingCSV, setDownloadingCSV] = useState(false);

  const csvDownload = async (filtered: boolean) => {
    setDownloadingCSV(true);

    // Convert JSON data to CSV
    const csv = Papa.unparse(rows);
    // Create a blob with the CSV data
    const blob = new Blob([csv], { type: "text/csv" });
    // Create a download link and click it to start the download
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "requests.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // fetch("/api/request", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     filter: advancedFilters,
    //     offset: 0,
    //     limit: 500,
    //     sort: sortLeaf,
    //   }),
    // })
    //   .then((res) => res.json())
    //   .then((res) => {
    //     const requests = res.data as HeliconeRequest[];
    //     const wrappedRequests = requests.map((request) => {
    //       const wrappedRequest = convertRequest(request, values);
    //       const obj: any = {};
    //       columns.forEach((col) => {
    //         if (filtered) {
    //           if (col.active) {
    //             obj[col.key] = wrappedRequest[col.key];
    //           }
    //         } else {
    //           obj[col.key] = wrappedRequest[col.key];
    //         }
    //       });
    //       return obj;
    //     });
    // // Convert JSON data to CSV
    // const csv = Papa.unparse(wrappedRequests);
    // // Create a blob with the CSV data
    // const blob = new Blob([csv], { type: "text/csv" });
    // // Create a download link and click it to start the download
    // const link = document.createElement("a");
    // link.href = URL.createObjectURL(blob);
    // link.download = "requests.csv";
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
    //   })
    //   .catch((e) => console.error(e))
    //   .finally(() => {
    //     setDownloadingCSV(false);
    //     setOpenExport(false);
    //   });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white hover:bg-sky-50 flex flex-row items-center gap-2"
      >
        <ArrowDownTrayIcon className="h-5 w-5 text-gray-900" />
        <p className="text-sm font-medium text-gray-900">Export</p>
      </button>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="flex flex-col space-y-4 sm:space-y-8 min-w-[350px] max-w-sm w-full">
          <div className="flex flex-col space-y-8">
            <div className="flex flex-col space-y-4">
              <p className="text-md sm:text-lg font-semibold text-gray-900">
                Export CSV
              </p>
              <p className="text-sm sm:text-md text-gray-600">
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

            <fieldset className="space-y-2">
              <p className="text-xs text-gray-600">Properties on export</p>
              <legend className="sr-only">Notification method</legend>
              <div className="space-y-2">
                {notificationMethods.map((notificationMethod) => (
                  <div
                    key={notificationMethod.id}
                    className="flex items-center"
                  >
                    <input
                      id={notificationMethod.id}
                      name="notification-method"
                      type="radio"
                      defaultChecked={notificationMethod.id === "filtered"}
                      className="h-4 w-4 border-gray-300 text-sky-600 focus:ring-sky-600 hover:cursor-pointer"
                      onClick={() => {
                        // setExportFiltered(notificationMethod.filtered);
                      }}
                    />
                    <label
                      htmlFor={notificationMethod.id}
                      className="ml-3 block text-sm font-medium leading-6 text-gray-600"
                    >
                      {notificationMethod.title}
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>
            <p className="text-sm sm:text-md text-gray-600">
              Export may take a lot of time. Please do not close this modal once
              export is started.
            </p>
          </div>

          <div className="w-full flex justify-end text-sm space-x-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex flex-row items-center rounded-md bg-white px-4 py-2 text-sm font-semibold border border-gray-300 hover:bg-gray-50 text-gray-900 shadow-sm hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
            >
              Cancel
            </button>
            <button
              className="items-center rounded-md bg-black px-4 py-2 text-md flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              //   onClick={() => csvExport.onClick(exportFiltered)}
            >
              {/* {csvExport.downloadingCSV ? (
                <>
                  <ArrowPathIcon
                    className={clsx("h-5 w-5 inline animate-spin mr-2")}
                  />
                  Exporting
                </>
              ) : (
                <p>Export</p>
              )} */}
              Export
            </button>
          </div>
        </div>
      </ThemedModal>
    </>
  );
}
