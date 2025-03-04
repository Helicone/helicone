import React from "react";
import {
  Table,
  TableHeader,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BeakerIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { DownloadIcon } from "lucide-react";

const defaultTableData = [
  {
    name: "Dataset for fine-tuning",
    createdAt: "8/28/2024, 2:36:44 PM",
    rows: "1,000",
  },
  {
    name: "Dataset for evaluation",
    createdAt: "8/28/2024, 2:36:44 PM",
    rows: "25",
  },
  {
    name: "Dataset for experiments",
    createdAt: "8/28/2024, 2:36:44 PM",
    rows: "25",
  },
  {
    name: "Bad data",
    createdAt: "8/28/2024, 2:36:44 PM",
    rows: "16",
  },
  {
    name: "Paid user dataset",
    createdAt: "8/28/2024, 2:36:44 PM",
    rows: "200",
  },
  {
    name: "Production dataset",
    createdAt: "8/28/2024, 2:36:44 PM",
    rows: "500",
  },
  {
    name: "Test dataset",
    createdAt: "8/28/2024, 2:36:44 PM",
    rows: "50",
  },
  {
    name: "Customer feedback",
    createdAt: "8/28/2024, 2:36:44 PM",
    rows: "150",
  },
  {
    name: "Support queries",
    createdAt: "8/28/2024, 2:36:44 PM",
    rows: "300",
  },
  {
    name: "Training examples",
    createdAt: "8/28/2024, 2:36:44 PM",
    rows: "750",
  },
];

interface DatasetVisualProps {
  numRows?: number;
  hideButtons?: boolean;
}

export const DatasetVisual = ({
  numRows = 6,
  hideButtons = false,
}: DatasetVisualProps) => {
  let displayData = defaultTableData.slice(0, numRows);

  if (hideButtons == false) {
    displayData.push({
      name: "",
      createdAt: "",
      rows: "",
    });
  }

  return (
    <div className="w-full w-full bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] flex flex-col">
      <div className="p-2">
        <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden">
          <Table className="table-auto [&_tr:last-child_td]:border-b-0 [&_th:first-child]:rounded-tl-lg [&_th:last-child]:rounded-tr-lg border-collapse">
            <TableHeader>
              <TableRow>
                <TableHead className="h-8 px-4 py-2 bg-[hsl(var(--muted))] text-md font-semibold text-[hsl(var(--foreground))] border-b border-r border-[hsl(var(--border))]">
                  Name
                </TableHead>
                <TableHead className="h-8 px-4 py-2 bg-[hsl(var(--muted))] text-md font-semibold text-[hsl(var(--foreground))] border-b border-r border-[hsl(var(--border))]">
                  Created At
                </TableHead>
                <TableHead className="h-8 px-4 py-2 bg-[hsl(var(--muted))] text-md font-semibold text-[hsl(var(--foreground))] border-b border-[hsl(var(--border))]">
                  Rows
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="p-2 px-4 h-8 text-[hsl(var(--muted-foreground))] font-light text-md border-r border-[hsl(var(--border))]">
                    {row.name}
                  </TableCell>
                  <TableCell className="p-2 px-4 h-8 text-[hsl(var(--muted-foreground))] font-light text-md border-r border-[hsl(var(--border))]">
                    {row.createdAt}
                  </TableCell>
                  <TableCell className="p-2 px-4 h-8 text-[hsl(var(--muted-foreground))] font-light text-md">
                    {row.rows}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[hsl(var(--background))] to-transparent pointer-events-none" />
      </div>

      {/* Action Buttons */}
      {!hideButtons && (
        <div className="w-full h-full pb-2 px-2 -mt-6 z-10">
          <div className="w-full h-full py-2 bg-[hsl(var(--primary))] rounded-2xl px-2">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="ghost"
                size="lg"
                className="flex-1 basis-0 text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary))]/80 font-semibold text-sm rounded-xl p-6 md:text-lg pointer-events-none"
              >
                <BeakerIcon className="w-5 h-5 mr-2 shrink-0" />
                Experiment
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="flex-1 basis-0 text-[hsl(var(--primary-foreground))] font-semibold text-sm bg-[hsl(var(--primary))]/80 rounded-xl p-6 md:text-lg pointer-events-none"
              >
                <SparklesIcon className="w-5 h-5 mr-2 shrink-0" />
                Fine-tune
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="flex-1 basis-0 bg-[hsl(var(--background))] text-[hsl(var(--primary))] font-semibold text-sm rounded-xl p-6 md:text-lg pointer-events-none"
              >
                <DownloadIcon className="w-5 h-5 mr-2 shrink-0" />
                Export
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
