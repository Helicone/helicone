import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { InfoIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import Papa from "papaparse";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useJawnClient } from "@/lib/clients/jawnHook";
import useNotification from "@/components/shared/notification/useNotification";
import { useOrg } from "@/components/layout/org/organizationContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ImportCSVDialog = ({
  open,
  onOpenChange,
  experimentId,
  experimentPromptInputKeys,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experimentId: string;
  experimentPromptInputKeys: string[];
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleFileParse = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const parsed = Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        transform: (value) => value.trim(),
      });

      const limitedRows = (parsed.data as Record<string, string>[]).slice(
        0,
        100
      );
      setFile(file);
      setRows(limitedRows);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileParse(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileParse(files[0]);
    }
  };

  const jawn = useJawnClient();
  const { setNotification } = useNotification();
  const queryClient = useQueryClient();
  const org = useOrg();
  const orgId = org?.currentOrg?.id;

  const handleImport = useMutation({
    mutationFn: async () => {
      const result = await jawn.POST(
        `/v2/experiment/{experimentId}/add-manual-rows-batch`,
        {
          params: {
            path: {
              experimentId,
            },
          },
          body: {
            inputs: rows,
          },
        }
      );

      if (result.error || !result.data) {
        throw new Error("Failed to import rows");
      }
    },
    onSuccess: () => {
      onOpenChange(false);
      setFile(null);
      setRows([]);
      queryClient.invalidateQueries({
        queryKey: ["experimentTable", orgId, experimentId],
      });
    },
    onError: () => {
      setNotification("Failed to import rows", "error");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import from CSV</DialogTitle>
          {experimentPromptInputKeys.length > 0 && (
            <DialogDescription>
              Import rows from a CSV file with the variable names as the columns{" "}
              <span className="font-semibold">
                (
                {experimentPromptInputKeys.length > 3
                  ? experimentPromptInputKeys.slice(0, 3).join(", ") + ", ..."
                  : experimentPromptInputKeys.join(", ")}
              </span>
              ).
            </DialogDescription>
          )}
        </DialogHeader>

        <label
          htmlFor="file-upload"
          className={cn(
            "group relative h-full flex flex-col items-center justify-center w-full aspect-video border-2 border-slate-300 border-dashed rounded-lg dark:border-slate-600 transition",
            { "dark:border-slate-400 dark:bg-slate-800": dragActive },
            { "h-fit aspect-auto": file },
            { "items-start justify-start": file },
            { "dark:hover:border-slate-500 dark:hover:bg-slate-800": file }
          )}
        >
          {!file ? (
            <>
              <div
                className="absolute inset-0 cursor-pointer"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              />
              <svg
                aria-hidden="true"
                className="w-10 h-10 mb-3 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
              {file ? (
                <div className="flex items-center justify-center">
                  <p>{(file as File).name}</p>
                </div>
              ) : (
                <p className="mb-2 text-sm text-slate-500">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
              )}
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
            </>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 w-full rounded-md">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <svg
                  className="w-4 h-4 text-slate-400 shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="8" y1="13" x2="16" y2="13" />
                  <line x1="8" y1="17" x2="16" y2="17" />
                  <line x1="8" y1="9" x2="10" y2="9" />
                </svg>
                <p className="truncate text-sm text-slate-600 dark:text-slate-300">
                  {file.name}
                </p>
              </div>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFile(null);
                  setRows([]);
                }}
                variant="outline"
                size="icon"
                className="bg-red-500 hover:bg-red-600 dark:bg-red-800 dark:hover:bg-red-900 text-white hover:text-white dark:text-white"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </label>
        {rows.length > 0 && (
          <Accordion
            type="single"
            collapsible
            className="w-full mt-4 overflow-x-auto"
          >
            <AccordionItem value="preview">
              <AccordionTrigger>
                Preview Data ({rows.length} rows)
              </AccordionTrigger>
              <AccordionContent>
                <div className="max-h-[300px] overflow-auto border rounded-md">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                      <tr>
                        {Object.keys(rows[0] || {})
                          .filter((header) =>
                            experimentPromptInputKeys.includes(header)
                          )
                          .map((header) => (
                            <th
                              key={header}
                              className="border border-slate-200 dark:border-slate-700 p-2 text-left"
                            >
                              {header}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        <tr key={index}>
                          {Object.entries(row)
                            .filter(([key]) =>
                              experimentPromptInputKeys.includes(key)
                            )
                            .map(([key, value], cellIndex) => (
                              <td
                                key={cellIndex}
                                className="border border-slate-200 dark:border-slate-700 p-2 max-w-[200px] max-h-[100px]"
                              >
                                <div className="truncate">{value}</div>
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        <DialogFooter className="flex items-end sm:justify-between sm:items-center gap-y-1 w-full">
          <div className="flex items-center gap-1">
            <InfoIcon className="w-4 h-4 text-slate-500" />
            <p className="text-sm text-slate-500">
              Currently, we only support importing up to 100 rows.
            </p>
          </div>
          {rows.length > 0 && file ? (
            <Button onClick={() => handleImport.mutate()}>
              Import {rows.length ?? "0"} rows
            </Button>
          ) : (
            <div></div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportCSVDialog;
