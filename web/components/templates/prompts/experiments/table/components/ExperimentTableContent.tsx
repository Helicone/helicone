import { Button } from "@/components/ui/button";
import {
  TableBody,
  TableCell,
  TableRow,
  Table,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  Table as TableType,
  useReactTable,
} from "@tanstack/react-table";
import { ListIcon, PlayIcon } from "lucide-react";
import { memo, useMemo, useRef } from "react";
import { useExperimentTable } from "../hooks/useExperimentTable";
import {
  ExperimentTableHeader,
  IndexColumnCell,
  InputCell,
  InputsHeaderComponent,
  PromptColumnHeader,
} from "./tableElementsRenderer";
import { clsx } from "clsx";
import AddColumnHeader from "../AddColumnHeader";
import { HypothesisCellRenderer } from "../cells/HypothesisCellRenderer";

type TableDataType = {
  index: number;
  inputs: Record<string, string>;
  rowRecordId: string;
  add_prompt: string;
  originalInputRecordId: string;
  [key: `prompt_version_${string}`]: {
    request_id: string;
    input_record_id: string;
  };
};

const MemoizedTableBody = memo(
  ({ table }: { table: TableType<TableDataType> }) => {
    return (
      <TableBody className="text-[13px] bg-white dark:bg-neutral-950 flex-1">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row: any) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
              className="border-b border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-neutral-950"
            >
              {row.getVisibleCells().map((cell: any) => (
                <TableCell
                  className={cn(
                    "p-0 align-baseline border-r border-slate-200 dark:border-slate-800",
                    cell.column.getIsLastColumn() && "border-r-0"
                  )}
                  key={cell.id}
                  style={{
                    width: cell.column.getSize(),
                    maxWidth: cell.column.getSize(),
                    minWidth: cell.column.getSize(),
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={table.getAllColumns().length}
              className="h-24 text-center"
            >
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    );
  },
  (prev, next) => prev.table.options.data === next.table.options.data
);

MemoizedTableBody.displayName = "MemoizedTableBody";

const ExperimentTableContent = ({
  experimentTableId,
  setToEditInputRecord,
  setRightPanel,
  setIsAddColumnDialogOpen,
  setExternallySelectedForkFromPromptVersionId,
}: {
  experimentTableId: string;
  setToEditInputRecord: (inputRecord: {
    id: string;
    inputKV: Record<string, string>;
  }) => void;
  setRightPanel: (panel: "add_manual" | "edit_inputs" | null) => void;
  setIsAddColumnDialogOpen: (open: boolean) => void;
  setExternallySelectedForkFromPromptVersionId: (
    promptVersionId: string
  ) => void;
}) => {
  const {
    promptVersionsData,
    inputKeysData,
    experimentTableQuery,
    promptVersionTemplateData,
  } = useExperimentTable(experimentTableId);

  const columnHelper = createColumnHelper<TableDataType>();

  const cellRefs = useRef<Record<string, any>>({});

  const columnDef = useMemo(
    () => [
      columnHelper.group({
        id: "index__outer",
        header: () => (
          <div className="flex justify-center items-center text-slate-400 dark:text-slate-600 group relative">
            <span className="group-hover:invisible transition-opacity duration-200">
              <ListIcon className="w-4 h-4" />
            </span>
            <Button
              variant="ghost"
              className="ml-2 p-0 border rounded-md h-[22px] w-[24px] items-center justify-center absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={async () => {
                await Promise.all(
                  (promptVersionsData ?? []).map(async (pv) => {
                    const rows = table.getRowModel().rows;
                    await Promise.all(
                      rows.map(async (row) => {
                        const cellRef = cellRefs.current[`${row.id}-${pv.id}`];
                        if (cellRef) {
                          await cellRef.runHypothesis();
                        }
                      })
                    );
                  })
                );
              }}
            >
              <PlayIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </Button>
          </div>
        ),
        columns: [
          columnHelper.accessor("index", {
            header: () => <></>,
            cell: ({ row }) => (
              <IndexColumnCell
                index={row.original.index}
                onRunRow={async () => {
                  await Promise.all(
                    (promptVersionsData ?? []).map((pv) => {
                      const cellRef = cellRefs.current[`${row.id}-${pv.id}`];
                      if (cellRef) {
                        cellRef.runHypothesis();
                      }
                    })
                  );
                }}
              />
            ),
            size: 20,
          }),
        ],
      }),
      columnHelper.group({
        id: "inputs__outer",
        header: () => <PromptColumnHeader label="Inputs" />,
        columns: [
          columnHelper.accessor("inputs", {
            header: () => (
              <InputsHeaderComponent inputs={inputKeysData ?? []} />
            ),
            cell: ({ row }) => (
              <InputCell
                experimentInputs={inputKeysData ?? []}
                rowInputs={row.original.inputs}
                rowRecordId={row.original.rowRecordId}
                onClick={() => {
                  setToEditInputRecord({
                    id: row.original.originalInputRecordId ?? "",
                    inputKV: row.original.inputs,
                  });
                  setRightPanel("edit_inputs");
                }}
              />
            ),
            size: 250,
          }),
        ],
      }),
      ...(promptVersionsData ?? []).map((pv) =>
        columnHelper.group({
          id: `prompt_version_${pv.id}__outer`,
          header: () => (
            <PromptColumnHeader
              label={
                pv.metadata?.label
                  ? `${pv.metadata?.label}`
                  : `v${pv.major_version}.${pv.minor_version}`
              }
              onForkColumn={() => {
                setExternallySelectedForkFromPromptVersionId(pv.id);
                setIsAddColumnDialogOpen(true);
              }}
              onRunColumn={async () => {
                const rows = table.getRowModel().rows;

                await Promise.all(
                  rows.map(async (row) => {
                    const cellRef = cellRefs.current[`${row.id}-${pv.id}`];
                    if (cellRef) {
                      await cellRef.runHypothesis();
                    }
                  })
                );
              }}
            />
          ),
          columns: [
            columnHelper.accessor(`prompt_version_${pv.id}`, {
              header: () => (
                <ExperimentTableHeader
                  experimentId={experimentTableId}
                  isOriginal={
                    pv.id ===
                    experimentTableQuery?.copied_original_prompt_version
                  }
                  promptVersionId={pv.id}
                  originalPromptTemplate={promptVersionTemplateData}
                  onForkPromptVersion={(promptVersionId: string) => {
                    setExternallySelectedForkFromPromptVersionId(
                      promptVersionId
                    );
                    setIsAddColumnDialogOpen(true);
                  }}
                />
              ),
              cell: ({ row }) => (
                <HypothesisCellRenderer
                  ref={(el) => {
                    if (el) {
                      cellRefs.current[`${row.id}-${pv.id}`] = el;
                    }
                  }}
                  experimentTableId={experimentTableId}
                  requestId={
                    row.original[`prompt_version_${pv.id}`]?.request_id ?? ""
                  }
                  inputRecordId={row.original.rowRecordId ?? ""}
                  prompt={promptVersionTemplateData}
                  promptVersionId={pv.id}
                />
              ),
            }),
          ],
        })
      ),
      columnHelper.group({
        id: "add_prompt__outer",
        header: () => (
          <AddColumnHeader
            experimentId={experimentTableId}
            promptVersionId={
              experimentTableQuery?.original_prompt_version ?? ""
            }
            selectedProviderKey=""
            handleAddColumn={async () => {}}
            wrapText={false}
            originalColumnPromptVersionId={promptVersionsData?.[0]?.id ?? ""}
            experimentPromptVersions={
              promptVersionsData?.map((pv) => ({
                id: pv.id,
                metadata: pv.metadata ?? {},
                major_version: pv.major_version,
                minor_version: pv.minor_version,
              })) ?? []
            }
            numberOfExistingPromptVersions={
              promptVersionsData?.length ? promptVersionsData.length - 1 : 0
            }
          />
        ),
        columns: [
          columnHelper.accessor("add_prompt", {
            header: () => <></>,
            cell: ({ row }) => <div></div>,
          }),
        ],
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      inputKeysData,
      promptVersionsData,
      experimentTableQuery,
      experimentTableId,
      promptVersionTemplateData,
    ]
  );

  const tableData = useMemo<TableDataType[]>(() => {
    if (!experimentTableQuery?.rows || !promptVersionsData) return [];

    return experimentTableQuery.rows.map((row, i) => ({
      index: i + 1,
      inputs: row.inputs,
      rowRecordId: row.id,
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
      originalInputRecordId:
        row.requests.find(
          (r) =>
            r.prompt_version_id ===
            experimentTableQuery?.copied_original_prompt_version
        )?.input_record_id ?? "",
    }));
  }, [
    experimentTableQuery?.rows,
    promptVersionsData,
    experimentTableQuery?.copied_original_prompt_version,
  ]);

  const tableConfig = useMemo(
    () => ({
      data: tableData,
      columns: columnDef,
      defaultColumn: {
        minSize: 50,
        maxSize: 1000,
        size: 300,
      },
      getCoreRowModel: getCoreRowModel(),
      enableColumnResizing: true,
      columnResizeMode: "onChange" as const,
    }),
    [tableData, columnDef]
  );

  const table = useReactTable(tableConfig);
  return (
    <Table className="border-collapse w-full border-t border-slate-200 dark:border-slate-800">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup, i) => (
          <TableRow
            key={headerGroup.id}
            className={clsx(
              "sticky top-0 bg-slate-50 dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800",
              i === 1 && "h-[225px]"
            )}
          >
            {headerGroup.headers.map((header, index) => (
              <TableHead
                key={header.id}
                style={{
                  width: header.getSize(),
                }}
                className="bg-white dark:bg-neutral-950 relative px-0"
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                <div
                  className="resizer absolute right-0 top-0 h-full w-4 cursor-col-resize"
                  {...{
                    onMouseDown: header.getResizeHandler(),
                    onTouchStart: header.getResizeHandler(),
                  }}
                >
                  <div
                    className={clsx(
                      "h-full w-1",
                      header.column.getIsResizing()
                        ? "bg-blue-700 dark:bg-blue-300"
                        : "bg-gray-500"
                    )}
                  />
                </div>
                {index < headerGroup.headers.length - 1 && (
                  <div className="absolute top-0 right-0 h-full w-px bg-slate-200 dark:bg-slate-800" />
                )}
                {/* <div className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-slate-200 dark:bg-slate-800" /> */}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      {table.getState().columnSizingInfo.isResizingColumn ? (
        <MemoizedTableBody table={table} />
      ) : (
        <TableBody className="text-[13px] bg-white dark:bg-neutral-950 flex-1">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="border-b border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-neutral-950"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    className={cn(
                      "p-0 align-baseline border-r border-slate-200 dark:border-slate-800",
                      cell.column.getIsLastColumn() && "border-r-0"
                    )}
                    key={cell.id}
                    style={{
                      width: cell.column.getSize(),
                      maxWidth: cell.column.getSize(),
                      minWidth: cell.column.getSize(),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
      )}
    </Table>
  );
};

export default ExperimentTableContent;
