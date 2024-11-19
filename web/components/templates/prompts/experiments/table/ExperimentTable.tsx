import { useExperimentTable } from "./hooks/useExperimentTable";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import AddColumnHeader from "./AddColumnHeader";
import {
  ExperimentTableHeader,
  InputsHeaderComponent,
  PromptColumnHeader,
} from "./components/tableElementsRenderer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ListIcon, PlayIcon, PlusIcon } from "lucide-react";
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import AddColumnDialog from "./AddColumnDialog";

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
    inputKeysData,
    isInputKeysLoading,
  } = useExperimentTable(experimentTableId);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showExperimentInputSelector, setShowExperimentInputSelector] =
    useState(false);
  const [showRandomInputSelector, setShowRandomInputSelector] = useState(false);

  const [rightPanel, setRightPanel] = useState<React.ReactNode | null>(null);

  const cellRefs = useRef<Record<string, any>>({});
  const [
    externallySelectedForkFromPromptVersionId,
    setExternallySelectedForkFromPromptVersionId,
  ] = useState<string | null>(null);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);

  const columnDef = useMemo<
    ColumnDef<{
      add_prompt: string;
      inputs: string;
      original: string | undefined;
      originalInputRecordId: string | undefined;
      index: number;
      [key: `prompt_version_${string}`]:
        | { request_id: string; input_record_id: string }
        | undefined;
    }>[]
    // @ts-ignore
  >(() => {
    return [
      {
        id: "index-outer",
        header: () => (
          <div className="flex justify-center items-center text-slate-400 dark:text-slate-600">
            <ListIcon className="w-4 h-4" />
          </div>
        ),
        columns: [
          {
            id: "index",
            header: "",
            accessorFn: (row) => row.index,
            cell: ({ row }) => (
              <div>
                {row.original.index}
                <Button
                  variant="ghost"
                  className="ml-2 p-0 border-slate-200 border rounded-md bg-slate-50 text-slate-500 h-[22px] w-[24px] flex items-center justify-center"
                  onClick={async () => {
                    await Promise.all(
                      (promptVersionsData ?? []).map((pv) => {
                        const cellRef = cellRefs.current[`${row.id}-${pv.id}`];
                        if (cellRef) {
                          // @ts-ignore
                          cellRef.runHypothesis();
                        }
                      })
                    );
                  }}
                >
                  <PlayIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </Button>
              </div>
            ),
            size: 20,
          },
        ],
      },
      {
        id: "inputs-upper",
        header: () => <div>Inputs</div>,
        columns: [
          {
            header: () => (
              <InputsHeaderComponent inputs={inputKeysData ?? []} />
            ),
            accessorKey: "inputs",
            cell: ({ row }) => {
              return (
                <div>
                  <ul>
                    {Object.entries(JSON.parse(row.original.inputs)).map(
                      ([key, value]) => (
                        <li key={key}>
                          <strong>{key}</strong>:{" "}
                          {value?.toString().slice(0, 10)}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              );
            },
            size: 250,
          },
        ],
      },
      {
        header:
          promptVersionsData?.[0]?.metadata?.label ??
          `v${promptVersionsData?.[0]?.major_version}.${promptVersionsData?.[0]?.minor_version}`,
        id: "original-outer",
        columns: [
          {
            accessorKey: "original",
            header: () => (
              <ExperimentTableHeader
                isOriginal={true}
                promptVersionId={promptVersionsData?.[0]?.id ?? ""}
                originalPromptTemplate={promptVersionTemplateData}
                originalPromptVersionId={promptVersionsData?.[0]?.id ?? ""}
                onForkPromptVersion={(promptVersionId: string) => {
                  setExternallySelectedForkFromPromptVersionId(promptVersionId);
                  setIsAddColumnDialogOpen(true);
                }}
              />
            ),
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
        ],
        size: 300,
      },
      ...(promptVersionsData?.slice(1) ?? []).map(
        (
          pv,
          i
        ): ColumnDef<{
          add_prompt: string;
          inputs: string;
          original: string | undefined;
          originalInputRecordId: string | undefined;
          index: number;
          [key: `prompt_version_${string}`]:
            | { request_id: string; input_record_id: string }
            | undefined;
        }> => ({
          id: `${pv.id}`,
          header: () => (
            <PromptColumnHeader
              label={
                pv.metadata?.label
                  ? `${pv.metadata?.label}`
                  : `v${pv.major_version}.${pv.minor_version}`
              }
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
            {
              id: `prompt_version_${pv.id}`,
              header: () => (
                <ExperimentTableHeader
                  isOriginal={false}
                  promptVersionId={pv.id}
                  originalPromptTemplate={promptVersionTemplateData}
                  originalPromptVersionId={promptVersionsData?.[0]?.id ?? ""}
                  onForkPromptVersion={(promptVersionId: string) => {
                    setExternallySelectedForkFromPromptVersionId(
                      promptVersionId
                    );
                    setIsAddColumnDialogOpen(true);
                  }}
                />
              ),
              accessorKey: `prompt_version_${pv.id}`,
              cell: ({ row }) => {
                return (
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
                    inputRecordId={
                      row.original[`prompt_version_${pv.id}`]
                        ?.input_record_id ??
                      row.original.originalInputRecordId ??
                      ""
                    }
                    prompt={promptVersionTemplateData}
                    promptVersionId={pv.id}
                    wrapText={false}
                  />
                );
              },
              size: 300,
            },
          ],
          // header: () => (
          //   <CustomHeaderComponent
          //     displayName={`Prompt ${i + 1}`}
          //     badgeText="Output"
          //     badgeVariant="secondary"
          //     promptVersionId={pv.id}
          //     promptTemplate={promptVersionTemplateData}
          //     onRunColumn={async () => {
          //       const rows = table.getRowModel().rows;

          //       // Run each cell using its ref
          //       await Promise.all(
          //         rows.map(async (row) => {
          //           const cellRef = cellRefs.current[`${row.id}-${pv.id}`];
          //           if (cellRef) {
          //             // @ts-ignore
          //             await cellRef.runHypothesis();
          //           }
          //         })
          //       );
          //     }}
          //     originalPromptTemplate={promptVersionTemplateData}
          //   />
          // ),
          // @ts-ignore
        })
      ),
      {
        id: "add_prompt",
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
          {
            header: "",
            accessorKey: "add_prompt",
            size: 200,
          },
        ],
      },
    ];
  }, [
    promptVersionsData,
    experimentTableId,
    experimentTableQuery?.original_prompt_version,
    promptVersionTemplateData,
    // runHypothesis,
    // table,
  ]);

  // Memoize the table data
  const tableData = useMemo(() => {
    if (!experimentTableQuery?.rows) return [];

    return experimentTableQuery.rows.map((row, i) => ({
      index: i + 1,
      inputs: JSON.stringify(row.inputs),
      original: row.requests.find((r) => r.is_original)?.request_id,
      ...(promptVersionsData?.slice(1) ?? []).reduce(
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
      minSize: 50,
      maxSize: 1000,
      size: 300,
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
    <>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={75}>
          <div className="h-full flex flex-col border-b divide-y divide-slate-300 dark:divide-slate-700">
            <div className="h-full overflow-x-auto bg-slate-100 dark:bg-slate-800">
              <div className="inline-block min-w-max bg-slate-50 dark:bg-black rounded-sm h-full">
                <Table className="border-collapse w-full">
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup, i) => (
                      <TableRow
                        key={headerGroup.id}
                        className={clsx(
                          "sticky top-0 bg-slate-50 dark:bg-slate-900 shadow-sm",
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
                              <div className="absolute top-0 right-0 h-full w-px bg-slate-300 dark:bg-slate-700" />
                            )}
                            <div className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-slate-300 dark:bg-slate-700" />
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody className="text-[13px]">
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
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
                  className="self-start flex flex-row space-x-2 text-slate-700 mt-0"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add row
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full px-2 py-2">
                <AddRowPopover
                  setPopoverOpen={setPopoverOpen}
                  setShowExperimentInputSelector={
                    setShowExperimentInputSelector
                  }
                  setShowRandomInputSelector={setShowRandomInputSelector}
                  handleAddRow={() => {}}
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
                {rightPanel}
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
    </>
  );
}
