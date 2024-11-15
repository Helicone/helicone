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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import clsx from "clsx";
import { useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/components/layout/organizationContext";

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
    runHypothesis,
  } = useExperimentTable(experimentTableId);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showExperimentInputSelector, setShowExperimentInputSelector] =
    useState(false);
  const [showRandomInputSelector, setShowRandomInputSelector] = useState(false);
  const queryClient = useQueryClient();
  const org = useOrg();
  const orgId = org?.currentOrg?.id;

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
        cell: ({ row }) => {
          return (
            <div>
              <ul>
                {Object.entries(JSON.parse(row.original.inputs)).map(
                  ([key, value]) => (
                    <li key={key}>
                      <strong>{key}</strong>: {value?.toString().slice(0, 10)}
                    </li>
                  )
                )}
              </ul>
            </div>
          );
        },
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
            promptTemplate={promptVersionTemplateData}
            onRunColumn={async () => {
              const rows = table.getRowModel().rows;
              await Promise.all(
                rows.map(async (row) => {
                  const inputRecordId =
                    // @ts-ignore
                    row.original[`prompt_version_${pv.id}`]?.input_record_id ??
                    row.original.originalInputRecordId;
                  const res = await runHypothesis.mutateAsync({
                    inputRecordId: inputRecordId ?? "",
                    promptVersionId: pv.id,
                  });
                  if (res) {
                    queryClient.invalidateQueries({
                      queryKey: ["experimentTable", orgId, experimentTableId],
                    });
                  }
                })
              );
            }}
          />
        ),
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
      // runHypothesis,
      // table,
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
  // const [data, setData] = useState(tableData);

  // useEffect(() => {
  //   setData(tableData);
  // }, [tableData]);

  const table = useReactTable({
    data: tableData,
    columns: columnDef,
    defaultColumn: {
      minSize: 20,
      maxSize: 800,
    },
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    // columnResizeDirection: "ltr",
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
    <div className="max-w-[100vw] relative">
      <div className="overflow-x-auto w-full" style={{ display: "block" }}>
        <Table className="w-max text-[13px]" style={{ tableLayout: "fixed" }}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="whitespace-nowrap">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      style={{
                        position: "relative",
                        width: header.getSize(),
                        minWidth: header.column.columnDef.minSize,
                      }}
                      key={header.id}
                      className="bg-white dark:bg-neutral-950"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      <button
                        onClick={() => header.column.getToggleSortingHandler()}
                        className="resizer absolute right-0 top-0 h-full w-4 cursor-col-resize"
                        {...{
                          onMouseDown: header.getResizeHandler(),
                          onTouchStart: header.getResizeHandler(),
                        }}
                      >
                        <div
                          className={clsx(
                            header.column.getIsResizing()
                              ? "bg-blue-700 dark:bg-blue-300"
                              : "bg-gray-500",
                            "h-full w-1"
                          )}
                        />
                      </button>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="bg-white dark:bg-neutral-950">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columnDef.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
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
