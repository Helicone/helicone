import { useExperimentTable } from "./hooks/useExperimentTable";
import { useCallback, useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import AddColumnHeader from "./AddColumnHeader";
import {
  CustomHeaderComponent,
  InputsHeaderComponent,
} from "./components/tableElementsRenderer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { AddRowPopover } from "./components/addRowPopover";
import ExperimentInputSelector from "../experimentInputSelector";
import { ExperimentRandomInputSelector } from "../experimentRandomInputSelector";
import { OriginalOutputCellRenderer } from "./cells/OriginalOutputCellRenderer";
import { HypothesisCellRenderer } from "./cells/HypothesisCellRenderer";

export function ExperimentTable({
  experimentTableId,
}: {
  experimentTableId: string;
}) {
  const {
    experimentTableQuery,
    promptVersionTemplateData,
    promptVersionsData,
    addExperimentTableRowInsertBatch,
  } = useExperimentTable(experimentTableId);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showExperimentInputSelector, setShowExperimentInputSelector] =
    useState(false);
  const [showRandomInputSelector, setShowRandomInputSelector] = useState(false);

  const columnDef = useMemo<
    ColumnDef<{
      add_prompt: string;
      inputs: string;
      original: string | undefined;
      originalInputRecordId: string | undefined;
    }>[]
  >(
    () => [
      {
        header: () => (
          <InputsHeaderComponent
            displayName="Inputs"
            badgeText="Input"
            columnName="Inputs"
            type="input"
          />
        ),
        accessorKey: "inputs",
      },
      {
        header: () => (
          <CustomHeaderComponent
            displayName="Original"
            badgeText="Output"
            badgeVariant="secondary"
            promptVersionId={
              experimentTableQuery?.original_prompt_version ?? ""
            }
            promptVersionTemplate={promptVersionTemplateData}
          />
        ),
        accessorKey: "original",
        cell: ({ row }) => {
          return (
            <OriginalOutputCellRenderer
              requestId={row.original?.original ?? ""}
              wrapText={false}
              prompt={promptVersionTemplateData}
            />
          );
        },
      },
      ...(promptVersionsData ?? []).map((pv, i) => ({
        id: pv.id,
        header: () => (
          <CustomHeaderComponent
            displayName={`Prompt ${i + 1}`}
            badgeText="Output"
            badgeVariant="secondary"
            promptVersionId={pv.id}
            promptVersionTemplate={promptVersionTemplateData}
          />
        ),
        // accessorKey: `prompt_version_${pv.id}`,
        // accessorFn: (row) => ({
        //   requestId: row.original[`prompt_version_${pv.id}`],
        //   inputRecordId: row.original?.input_record_id,
        // }),
        // @ts-ignore
        cell: ({ row }) => {
          return (
            <HypothesisCellRenderer
              experimentTableId={experimentTableId}
              requestId={
                row.original[`prompt_version_${pv.id}`]?.request_id ?? ""
              }
              inputRecordId={
                row.original[`prompt_version_${pv.id}`]?.input_record_id ??
                row.original.originalInputRecordId
              }
              prompt={promptVersionTemplateData}
              promptVersionId={pv.id}
              wrapText={false}
            />
          );
        },
      })),
      {
        header: () => (
          <AddColumnHeader
            experimentId={experimentTableId}
            promptVersionId={
              experimentTableQuery?.original_prompt_version ?? ""
            }
            selectedProviderKey=""
            handleAddColumn={async () => {}}
            wrapText={false}
          />
        ),
        accessorKey: "add_prompt",
      },
    ],
    [
      promptVersionsData,
      experimentTableId,
      experimentTableQuery?.original_prompt_version,
      promptVersionTemplateData,
    ]
  );

  // Memoize the table data
  const tableData = useMemo(() => {
    if (!experimentTableQuery?.rows) return [];

    return experimentTableQuery.rows.map((row) => ({
      inputs: JSON.stringify(row.inputs),
      original: row.requests.find((r) => r.is_original)?.request_id,
      ...(promptVersionsData ?? []).reduce(
        (acc, pv) => ({
          ...acc,
          [`prompt_version_${pv.id}`]: row.requests.find(
            (r) => r.prompt_version_id === pv.id
          ),
        }),
        {}
      ),
      add_prompt: "",
      originalInputRecordId: row.requests.find((r) => r.is_original)
        ?.input_record_id,
    }));
  }, [experimentTableQuery?.rows, promptVersionsData]);

  const table = useReactTable({
    data: tableData,
    columns: columnDef,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleAddRowInsertBatch = useCallback(
    (
      rows: {
        inputRecordId: string;
        inputs: Record<string, string>;
      }[]
    ) => {
      const newRows = rows.map((row) => ({
        inputRecordId: row.inputRecordId,
        inputs: row.inputs,
      }));

      if (!newRows) return;

      addExperimentTableRowInsertBatch.mutate({
        rows: newRows,
      });
    },
    [addExperimentTableRowInsertBatch, experimentTableQuery]
  );

  return (
    <div>
      <table className="table-auto w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columnDef.length} className="h-24 text-center">
                No results.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="self-start flex flex-row space-x-2 text-slate-700 mt-0"
          >
            <PlusIcon className="h-4 w-4" />
            Add row
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full px-2 py-2">
          <AddRowPopover
            setPopoverOpen={setPopoverOpen}
            setShowExperimentInputSelector={setShowExperimentInputSelector}
            setShowRandomInputSelector={setShowRandomInputSelector}
            handleAddRow={() => {}}
          />
        </PopoverContent>
      </Popover>

      <ExperimentRandomInputSelector
        open={showRandomInputSelector}
        setOpen={setShowRandomInputSelector}
        handleAddRows={handleAddRowInsertBatch}
        promptVersionId={experimentTableQuery?.original_prompt_version ?? ""}
        onSuccess={async (success) => {}}
      />

      <ExperimentInputSelector
        open={showExperimentInputSelector}
        setOpen={setShowExperimentInputSelector}
        promptVersionId={experimentTableQuery?.original_prompt_version ?? ""}
        handleAddRows={handleAddRowInsertBatch}
        onSuccess={async (success) => {}}
      />
    </div>
  );
}
