import { useExperimentTable } from "./hooks/useExperimentTable";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import AddColumnHeader from "./AddColumnHeader";
import {
  ExperimentTableHeader,
  IndexColumnCell,
  InputCell,
  InputsHeaderComponent,
  PromptColumnHeader,
} from "./components/tableElementsRenderer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ListIcon, PlusIcon } from "lucide-react";
import { AddRowPopover } from "./components/addRowPopover";
import ExperimentInputSelector from "../experimentInputSelector";
import { ExperimentRandomInputSelector } from "../experimentRandomInputSelector";
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import AddColumnDialog from "./AddColumnDialog";
import EditInputsPanel from "./EditInputsPanel";
import AddManualRowPanel from "./AddManualRowPanel";

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
    inputKeysData,
  } = useExperimentTable(experimentTableId);

  console.log(experimentTableQuery);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showExperimentInputSelector, setShowExperimentInputSelector] =
    useState(false);
  const [showRandomInputSelector, setShowRandomInputSelector] = useState(false);

  const [rightPanel, setRightPanel] = useState<
    "edit_inputs" | "add_manual" | null
  >(null);
  const [toEditInputRecord, setToEditInputRecord] = useState<{
    id: string;
    inputKV: Record<string, string>;
  } | null>(null);

  const cellRefs = useRef<Record<string, any>>({});
  const [
    externallySelectedForkFromPromptVersionId,
    setExternallySelectedForkFromPromptVersionId,
  ] = useState<string | null>(null);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);

  const columnHelper = createColumnHelper<TableDataType>();

  const columnDef = useMemo(
    () => [
      columnHelper.group({
        id: "index__outer",
        header: () => (
          <div className="flex justify-center items-center text-slate-400 dark:text-slate-600">
            <ListIcon className="w-4 h-4" />
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

                // Run each cell using its ref
                await Promise.all(
                  rows.map(async (row) => {
                    const cellRef = cellRefs.current[`${row.id}-${pv.id}`];
                    if (cellRef) {
                      // @ts-ignore
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
                  wrapText={false}
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
            size: 200,
          }),
        ],
        size: 200,
      }),
    ],
    [
      inputKeysData,
      promptVersionsData,
      experimentTableQuery,
      experimentTableId,
      promptVersionTemplateData,
      setExternallySelectedForkFromPromptVersionId,
      setIsAddColumnDialogOpen,
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

      if (!newRows.length) return;

      addExperimentTableRowInsertBatch.mutate({
        rows: newRows,
      });
    },
    [addExperimentTableRowInsertBatch]
  );

  return (
    <div className="h-[calc(100vh-100px)]">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={75}>
          <div className="flex flex-col">
            <div className="max-h-[calc(100vh-100px)] h-full overflow-y-auto overflow-x-auto bg-slate-100 dark:bg-neutral-950">
              <div className="w-fit h-full bg-slate-50 dark:bg-black rounded-sm">
                <Table className="border-collapse w-full">
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup, i) => (
                      <TableRow
                        key={headerGroup.id}
                        className={clsx(
                          "sticky top-0 bg-slate-50 dark:bg-slate-900 shadow-sm border-b border-slate-300 dark:border-slate-700",
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
                            {/* {index < headerGroup.headers.length - 1 && ( */}
                            <div className="absolute top-0 right-0 h-full w-px bg-slate-300 dark:bg-slate-700" />
                            {/* )} */}
                            <div className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-slate-300 dark:bg-slate-700" />
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody className="text-[13px] bg-white dark:bg-neutral-950 flex-1">
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                          className="border-b border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-neutral-950"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              className="p-0 align-baseline border-r border-slate-300 dark:border-slate-700"
                              key={cell.id}
                              style={{
                                width: cell.column.getSize(),
                                maxWidth: cell.column.getSize(),
                                minWidth: cell.column.getSize(),
                              }}
                            >
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
            </div>

            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-start flex flex-row space-x-2 text-slate-700 mt-0 shadow-none"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add row
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full px-2 py-2">
                <AddRowPopover
                  setPopoverOpen={setPopoverOpen}
                  setShowAddManualRow={() => setRightPanel("add_manual")}
                  setShowExperimentInputSelector={
                    setShowExperimentInputSelector
                  }
                  setShowRandomInputSelector={setShowRandomInputSelector}
                />
              </PopoverContent>
            </Popover>

            <ExperimentRandomInputSelector
              open={showRandomInputSelector}
              setOpen={setShowRandomInputSelector}
              handleAddRows={handleAddRowInsertBatch}
              promptVersionId={
                experimentTableQuery?.original_prompt_version ?? ""
              }
              onSuccess={async (success) => {}}
            />

            <ExperimentInputSelector
              open={showExperimentInputSelector}
              setOpen={setShowExperimentInputSelector}
              promptVersionId={
                experimentTableQuery?.original_prompt_version ?? ""
              }
              handleAddRows={handleAddRowInsertBatch}
              onSuccess={async (success) => {}}
            />
          </div>
        </ResizablePanel>

        {/* Add right panel if needed */}
        {rightPanel && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel minSize={25} maxSize={75}>
              <div className="h-full flex-shrink-0 flex flex-col">
                {rightPanel === "edit_inputs" && (
                  <EditInputsPanel
                    experimentId={experimentTableId}
                    inputRecord={toEditInputRecord}
                    inputKeys={inputKeysData ?? []}
                    onClose={() => {
                      setToEditInputRecord(null);
                      setRightPanel(null);
                    }}
                  />
                )}
                {rightPanel === "add_manual" && (
                  <AddManualRowPanel
                    experimentId={experimentTableId}
                    inputKeys={inputKeysData ?? []}
                    onClose={() => setRightPanel(null)}
                  />
                )}
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
      <AddColumnDialog
        isOpen={isAddColumnDialogOpen}
        onOpenChange={setIsAddColumnDialogOpen}
        experimentId={experimentTableId}
        originalColumnPromptVersionId={promptVersionsData?.[0]?.id ?? ""}
        selectedForkFromPromptVersionId={
          externallySelectedForkFromPromptVersionId ?? ""
        }
        numberOfExistingPromptVersions={
          promptVersionsData?.length ? promptVersionsData.length - 1 : 0
        }
      />
    </div>
  );
}
