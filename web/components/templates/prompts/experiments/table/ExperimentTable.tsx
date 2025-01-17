import { useExperimentTable } from "./hooks/useExperimentTable";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { ListIcon, PlusIcon, PlayIcon } from "lucide-react";
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
import { IslandContainer } from "@/components/ui/islandContainer";
import HcBreadcrumb from "@/components/ui/hcBreadcrumb";
import { Switch } from "@/components/ui/switch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ScoresEvaluatorsConfig from "./scores/ScoresEvaluatorsConfig";
import ScoresGraphContainer from "./scores/ScoresGraphContainer";
import { useOrg } from "@/components/layout/org/organizationContext";
import { cn } from "@/lib/utils";
import { useJawnClient } from "@/lib/clients/jawnHook";
import useOnboardingContext, {
  ONBOARDING_STEPS,
} from "@/components/layout/onboardingContext";
import { generateOpenAITemplate } from "@/components/shared/CreateNewEvaluator/evaluatorHelpers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TableDataType = {
  index: number;
  inputs: Record<string, string>;
  autoInputs: any[];
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
    wrapText,
  } = useExperimentTable(experimentTableId);

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
    autoInputs: Record<string, any>;
  } | null>(null);
  const [showScores, setShowScores] = useState(false);

  const cellRefs = useRef<Record<string, any>>({});
  const [
    externallySelectedForkFromPromptVersionId,
    setExternallySelectedForkFromPromptVersionId,
  ] = useState<string | null>(null);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);

  const org = useOrg();
  const orgId = org?.currentOrg?.id ?? "";

  const columnHelper = createColumnHelper<TableDataType>();

  const columnDef = useMemo(
    () => [
      columnHelper.group({
        id: "index__outer",
        header: () => (
          <div className="flex justify-center items-center text-slate-400 dark:text-slate-600 group relative">
            <span className="group-hover:invisible transition-opacity duration-200">
              <ListIcon className="w-4 h-4" />
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="ml-2 p-0 border rounded-md h-[22px] w-[24px] items-center justify-center absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <PlayIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onSelect={async () => {
                    await Promise.all(
                      (promptVersionsData ?? []).map(async (pv) => {
                        const rows = table.getRowModel().rows;
                        await Promise.all(
                          rows.map(async (row) => {
                            const cellRef =
                              cellRefs.current[`${row.id}-${pv.id}`];
                            if (cellRef) {
                              await cellRef.runHypothesis();
                            }
                          })
                        );
                      })
                    );
                  }}
                >
                  Run all cells
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={async () => {
                    await Promise.all(
                      (promptVersionsData ?? []).map(async (pv) => {
                        const rows = table.getRowModel().rows;
                        await Promise.all(
                          rows.map(async (row) => {
                            const cellRef =
                              cellRefs.current[`${row.id}-${pv.id}`];
                            if (cellRef) {
                              await cellRef.runHypothesisIfRequired();
                            }
                          })
                        );
                      })
                    );
                  }}
                >
                  Run unexecuted cells
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
        header: () => (
          <PromptColumnHeader label="Inputs" promptVersionId="inputs" />
        ),
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
                experimentAutoInputs={row.original.autoInputs}
                onClick={() => {
                  setToEditInputRecord({
                    id: row.original.originalInputRecordId ?? "",
                    inputKV: row.original.inputs,
                    autoInputs: row.original.autoInputs,
                  });
                  setRightPanel("edit_inputs");
                }}
              />
            ),
            size: 250,
            enableResizing: true,
          }),
        ],
      }),
      ...(promptVersionsData ?? []).map((pv) =>
        columnHelper.group({
          id: `prompt_version_${pv.id}__outer`,
          header: () => (
            <PromptColumnHeader
              promptVersionId={pv.id}
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
                  originalPromptVersionId={
                    experimentTableQuery?.copied_original_prompt_version ?? ""
                  }
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
              size: 400,
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
      autoInputs: row.auto_prompt_inputs,
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
        size: 200,
        enableResizing: true,
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
        autoInputs: any[];
      }[]
    ) => {
      const newRows = rows.map((row) => ({
        inputRecordId: row.inputRecordId,
        inputs: row.inputs,
        autoInputs: row.autoInputs,
      }));

      if (!newRows.length) return;

      addExperimentTableRowInsertBatch.mutate({
        rows: newRows,
      });
    },
    [addExperimentTableRowInsertBatch]
  );

  const queryClient = useQueryClient();

  const handleShowScoresChange = useCallback(
    (checked: boolean) => {
      if (!checked) {
        queryClient.setQueryData(["selectedScoreKey", experimentTableId], null);
        queryClient.setQueryData(["experimentScores", experimentTableId], {});

        for (const promptVersion of promptVersionsData ?? []) {
          queryClient.setQueryData(
            ["experimentScores", experimentTableId, promptVersion.id],
            {}
          );
        }
      }
      setShowScores(checked);
    },
    [queryClient, experimentTableId]
  );

  const jawn = useJawnClient();
  const {
    isOnboardingVisible,
    currentStep,
    setOnClickElement,
    onClickElement,
    setCurrentStep,
  } = useOnboardingContext();

  // Fetch input records using useQuery
  const {
    data: inputRecordsData,
    isLoading,
    isError,
  } = useQuery(
    ["inputRecords", experimentTableQuery?.original_prompt_version],
    async () => {
      const res = await jawn.POST(
        "/v1/prompt/version/{promptVersionId}/inputs/query",
        {
          params: {
            path: {
              promptVersionId:
                experimentTableQuery?.original_prompt_version ?? "",
            },
          },
          body: {
            limit: 1000, // Adjust limit as needed
          },
        }
      );
      return res.data?.data ?? [];
    },
    {
      enabled:
        isOnboardingVisible &&
        experimentTableQuery?.original_prompt_version !== undefined, // Fetch only when the drawer is open
    }
  );

  useEffect(() => {
    if (
      isOnboardingVisible &&
      currentStep === ONBOARDING_STEPS.EXPERIMENTS_CLICK_SHOW_SCORES.stepNumber
    ) {
      setOnClickElement(() => () => {
        setShowScores(!showScores);
        setCurrentStep(currentStep + 1);
      });

      const keydownHandler = (e: KeyboardEvent) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          setShowScores(!showScores);
          setCurrentStep(currentStep + 1);
        }
      };
      window.addEventListener("keydown", keydownHandler);

      const openAIFunction = generateOpenAITemplate({
        name: "Humor",
        description: "Check if the response is funny",
        expectedValueType: "choice",
        choiceScores: [
          {
            score: 1,
            description: "Not Funny",
          },
          {
            score: 2,
            description: "Slightly Funny",
          },
          {
            score: 3,
            description: "Funny",
          },
          {
            score: 4,
            description: "Very Funny",
          },
          {
            score: 5,
            description: "Hilarious",
          },
        ],
        model: "gpt-4o-mini",
      });

      jawn.POST("/v1/evaluator", {
        body: {
          llm_template: openAIFunction,
          scoring_type: "LLM-CHOICE",
          name: "Humor",
        },
      });
      return () => window.removeEventListener("keydown", keydownHandler);
    }
  }, [isOnboardingVisible, currentStep, showScores]);

  return (
    <>
      <div className="flex justify-between items-center py-4 pr-4">
        <IslandContainer>
          <HcBreadcrumb
            pages={[
              {
                href: "/experiments",
                name: "Experiments",
              },
              {
                href: `/experiments/${experimentTableId}`,
                name: experimentTableQuery?.name ?? "Experiment",
              },
            ]}
          />
        </IslandContainer>
        <div className="flex items-center gap-5">
          <div
            className="flex gap-2 items-center relative"
            data-onboarding-step={
              ONBOARDING_STEPS.EXPERIMENTS_CLICK_SHOW_SCORES.stepNumber
            }
          >
            <Switch
              size="sm"
              checked={showScores}
              onCheckedChange={(checked) => {
                handleShowScoresChange(checked);
                setShowScores(checked);
              }}
            />
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
              Show scores
            </p>
            {isOnboardingVisible &&
              currentStep ===
                ONBOARDING_STEPS.EXPERIMENTS_CLICK_SHOW_SCORES.stepNumber && (
                <div className="absolute right-1/2 top-1/2 translate-x-2 -translate-y-1/2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                  </span>
                </div>
                // <div className="absolute right-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 animate-ping rounded-full">
                //   <div className="w-full h-full bg-red-500 rounded-full"></div>
                // </div>
              )}
          </div>
          <div className="flex gap-2 items-center">
            <Switch
              size="sm"
              checked={wrapText.data ?? false}
              onCheckedChange={(checked) => {
                queryClient.setQueryData(
                  ["wrapText", experimentTableId],
                  checked
                );
              }}
            />
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
              Wrap text
            </p>
          </div>
        </div>
      </div>
      <div className="h-[calc(100vh-50px)]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={75}>
            <div className="flex flex-col w-full">
              {showScores && (
                <div className="flex flex-col w-full bg-white dark:bg-neutral-950 border-y border-r border-slate-200 dark:border-slate-800">
                  {promptVersionsData && (
                    <ScoresGraphContainer
                      promptVersions={(promptVersionsData ?? []).map((pv) => ({
                        ...pv,
                        metadata: pv.metadata ?? {},
                      }))}
                      experimentId={experimentTableId}
                    />
                  )}
                  <div className="flex justify-between items-center bg-white dark:bg-neutral-950 p-2">
                    <ScoresEvaluatorsConfig experimentId={experimentTableId} />
                  </div>
                </div>
              )}
              <div
                className={clsx(
                  "bg-white dark:bg-neutral-950 w-full overflow-x-auto",
                  showScores
                    ? "h-[calc(100vh-90px-300px-50px)]"
                    : "h-[calc(100vh-90px)]"
                )}
              >
                <div
                  className="bg-white dark:bg-black rounded-sm inline-block min-w-0 w-max h-auto"
                  // style={{ width: "fit-content" }}
                >
                  <Table className="border-collapse border-t border-r border-b border-slate-200 dark:border-slate-800 h-[1px]">
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
                              style={{ width: header.getSize() }}
                              className={cn(
                                "bg-white dark:bg-neutral-950 relative p-0",
                                index < headerGroup.headers.length - 1 &&
                                  "border-r border-slate-200 dark:border-slate-800"
                              )}
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
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody className="text-[13px] bg-white dark:bg-neutral-950">
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
                                  "p-0 align-baseline border-r border-slate-200 dark:border-slate-800 h-full relative",
                                  "w-full max-w-0",
                                  cell.column.getIsLastColumn() && "border-r-0"
                                )}
                                style={{
                                  width: cell.column.getSize(),
                                  maxWidth: cell.column.getSize(),
                                }}
                                key={cell.id}
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
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="self-start flex flex-row space-x-2 text-slate-800 mt-0 shadow-none"
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
              </div>

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
                      autoInputs={toEditInputRecord?.autoInputs ?? {}}
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
    </>
  );
}
