import { useOrg } from "@/components/layout/organizationContext";
import { Button } from "@/components/ui/button";
import { getJawnClient } from "@/lib/clients/jawn";
import {
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  GridApi,
  GridReadyEvent,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import { AgGridReact } from "ag-grid-react";
import React, { useCallback, useMemo, useRef, useState } from "react";
import AddColumnHeader from "./AddColumnHeader";
import { HypothesisCellRenderer } from "./cells/HypothesisCellRenderer";
import { OriginalMessagesCellRenderer } from "./cells/OriginalMessagesCellRenderer";
import { OriginalOutputCellRenderer } from "./cells/OriginalOutputCellRenderer";

import { PlusIcon } from "@heroicons/react/24/outline";
import ExperimentInputSelector from "../experimentInputSelector";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLocalStorage } from "@/services/hooks/localStorage";
import clsx from "clsx";
import LoadingAnimation from "../../../../shared/loadingAnimation";
import ExportButton from "../../../../shared/themed/table/exportButton";
import { ExperimentRandomInputSelector } from "../experimentRandomInputSelector";
import { AddRowPopover } from "./components/addRowPopover";
import { ColumnsDropdown } from "./components/customButtonts";
import { NewExperimentPopover } from "./components/newExperimentPopover";
import {
  CustomHeaderComponent,
  InputCellRenderer,
  InputsHeaderComponent,
  RowNumberCellRenderer,
  RowNumberHeaderComponent,
} from "./components/tableElementsRenderer";
import { useExperimentTable } from "./hooks/useExperimentTable";
import ScoresEvaluatorsConfig from "./scores/ScoresEvaluatorsConfig";
import ScoresTableContainer from "./scores/ScoresTableContainer";
import useOnboardingContext, {
  ONBOARDING_STEPS,
} from "@/components/layout/onboardingContext";
import OnboardingPopover from "@/components/templates/onboarding/OnboardingPopover";

interface ExperimentTableProps {
  experimentTableId: string;
}

export function ExperimentTable({ experimentTableId }: ExperimentTableProps) {
  const org = useOrg();
  const orgId = org?.currentOrg?.id;

  const {
    experimentTableQuery,
    isExperimentTableLoading,
    isExperimentTableRefetching,
    refetchExperimentTable,
    addExperimentTableColumn,
    addExperimentTableRow,
    deleteExperimentTableRow,
    updateExperimentCell,
    runHypothesisMutation,
    addExperimentTableRowInsertBatch,
    promptVersionTemplateData,
  } = useExperimentTable(orgId || "", experimentTableId);
  const promptSubversionId = experimentTableQuery?.promptSubversionId;

  const [wrapText, setWrapText] = useState(false);
  const [columnView, setColumnView] = useState<"all" | "inputs" | "outputs">(
    "all"
  );
  const [showScoresTable, setShowScoresTable] = useLocalStorage(
    "showScoresTable",
    false
  );

  const [popoverOpen, setPopoverOpen] = useState(false);

  const [showExperimentInputSelector, setShowExperimentInputSelector] =
    useState(false);

  const experimentTableRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<GridApi | null>(null);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridRef.current = params.api;
  }, []);

  const handleRunHypothesis = useCallback(
    (
      hypothesisId: string,
      cells: Array<{
        cellId: string;
        columnId: string;
      }>
    ) => {
      runHypothesisMutation.mutate({ hypothesisId, cells });
    },
    [runHypothesisMutation]
  );

  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>(
    {}
  );

  const onColumnResized = useCallback((event: ColumnResizedEvent) => {
    if (event.finished && event.columns && event.columns.length > 0) {
      const newWidths: { [key: string]: number } = {};
      event.columns.forEach((column) => {
        if (column && column.getColId()) {
          newWidths[column.getColId()] = column.getActualWidth();
        }
      });
      setColumnWidths((prev) => ({
        ...prev,
        ...newWidths,
      }));
    }
  }, []);

  const [columnOrder, setColumnOrder] = useState<string[]>([]);

  const onColumnMoved = useCallback((event: ColumnMovedEvent) => {
    const newOrder = event.api.getAllGridColumns().map((col) => col.getColId());
    setColumnOrder(newOrder);
  }, []);

  const handleAddRow = useCallback(
    (inputs?: Record<string, string>) => {
      addExperimentTableRow.mutate({
        promptVersionId:
          (experimentTableQuery?.promptSubversionId as string) ?? "",
        inputs,
      });
    },
    [addExperimentTableRow, experimentTableQuery?.promptSubversionId]
  );

  const handleDeleteRow = useCallback(
    (rowIndex: number) => {
      deleteExperimentTableRow.mutate(rowIndex);
    },
    [deleteExperimentTableRow]
  );

  const handleAddColumn = useCallback(
    (
      columnName: string,
      columnType: "experiment" | "input" | "output",
      hypothesisId?: string,
      promptVersionId?: string
    ) => {
      addExperimentTableColumn.mutate({
        promptVersionId: promptVersionId ?? "",
        columnName,
        columnType,
        hypothesisId,
      });
    },
    [addExperimentTableColumn]
  );

  const handleAddRowInsertBatch = useCallback(
    (
      rows: {
        inputRecordId: string;
        datasetId: string;
        inputs: Record<string, string>;
        sourceRequest?: string;
      }[]
    ) => {
      const columns = experimentTableQuery?.columns?.filter(
        (column) => column.columnType === "input"
      );

      if (!columns) return;

      const newRows = rows.map((row) => {
        const cells = Object.entries(row.inputs ?? {}).map(([key, value]) => ({
          columnId:
            columns.find((column) => column.columnName === key)?.id ?? "",
          value,
        }));

        return {
          inputRecordId: row.inputRecordId,
          datasetId: row.datasetId,
          inputs: row.inputs,
          cells,
          sourceRequest: row.sourceRequest,
        };
      });

      if (!newRows) return;

      addExperimentTableRowInsertBatch.mutate({
        rows: newRows,
      });
    },
    [addExperimentTableRowInsertBatch, experimentTableQuery]
  );

  const headerClass = clsx(
    "border-r border-[#E2E8F0] text-center items-center justify-center"
  );

  const fetchExperimentHypothesisScores = useCallback(
    async (hypothesisId: string) => {
      const jawnClient = getJawnClient(orgId);
      const result = await jawnClient.POST(
        "/v1/experiment/hypothesis/{hypothesisId}/scores/query",
        {
          params: {
            path: {
              hypothesisId,
            },
          },
        }
      );
      return result.data ?? {};
    },
    [orgId]
  );

  const headerComponentParams = useMemo(
    () => ({
      promptVersionId: experimentTableQuery?.promptSubversionId ?? "",
      experimentId: experimentTableQuery?.experimentId,
      selectedProviderKey: "",
      handleAddColumn,
      wrapText,
    }),
    [
      experimentTableQuery?.promptSubversionId,
      experimentTableQuery?.experimentId,
      handleAddColumn,
      wrapText,
    ]
  );

  const columnDefs = useMemo<ColDef[]>(() => {
    let columns: ColDef[] = [
      // Row number column (keep as is)
      {
        headerComponent: RowNumberHeaderComponent,
        field: "rowNumber",
        width: 50,
        cellRenderer: RowNumberCellRenderer,
        pinned: "left",
        cellClass:
          "border-r border-[#E2E8F0] text-center text-slate-700 justify-center flex-1 items-center",
        headerClass,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        autoHeight: wrapText,
      },
    ];
    let experimentColumnId = 1;

    Array.from(experimentTableQuery?.columns || []).forEach((column, index) => {
      if (column.columnType === "input") {
        columns.push({
          field: column.id,
          headerName: column.columnName,
          width: 150,
          cellRenderer: InputCellRenderer,
          cellRendererParams: {
            index: index,
            wrapText,
            columnId: column.id,
          },
          cellClass: "border-r border-[#E2E8F0] text-slate-700 pt-2.5",
          headerClass: "border-r border-[#E2E8F0]",
          headerComponent: InputsHeaderComponent,
          headerComponentParams: {
            index: index,
            displayName: column.columnName,
            badgeText: "Input",
            columnName: column.columnName,
            type: column.columnType,
          },
          cellStyle: {
            justifyContent: "start",
            whiteSpace: wrapText ? "normal" : "nowrap",
          },
          autoHeight: wrapText,
          editable: false, // Set this to false to prevent default editing
        });
      } else if (column.columnType === "output") {
        columns.push({
          field: column.id,
          headerName: "Original",
          width: 200,
          headerComponent: CustomHeaderComponent,
          headerComponentParams: {
            displayName: "Original",
            badgeText: "Output",
            badgeVariant: "secondary",
            promptVersionId: promptVersionTemplateData?.id ?? "",
            promptVersionTemplate: promptVersionTemplateData || {},
          },
          cellClass: "border-r border-[#E2E8F0] text-slate-700 pt-2.5",
          headerClass: headerClass,
          cellRenderer: OriginalOutputCellRenderer,
          cellRendererParams: {
            prompt: promptVersionTemplateData,
            hypothesisId: "original",
            handleRunHypothesis,
            wrapText,
            columnId: column.id,
          },
          cellStyle: {
            verticalAlign: "middle",
            textAlign: "left",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: wrapText ? "normal" : "nowrap",
          },
          autoHeight: wrapText,
        });
      } else if (column.columnType === "experiment") {
        if (columnView === "all" || columnView === "outputs") {
          columns.push({
            field: column.id,
            headerName: column.columnName,
            width: 230,
            suppressSizeToFit: true,
            cellRenderer: HypothesisCellRenderer,
            cellRendererParams: {
              hypothesisId: column.metadata?.hypothesisId,
              handleRunHypothesis,
              wrapText,
              columnId: column.id,
            },
            headerComponent: CustomHeaderComponent,
            headerComponentParams: {
              displayName: `Experiment ${experimentColumnId++}`,
              badgeText: "Output",
              badgeVariant: "secondary",
              hypothesisId: column.metadata?.hypothesisId ?? "",
              promptVersionId: column.metadata?.promptVersionId ?? "",
              originalPromptTemplate: promptVersionTemplateData,
              runs: column.cells.filter((cell) => cell.value),
              onRunColumn: async (colId: string) => {
                const cells = experimentTableQuery?.rows
                  .map((row) => {
                    const cell = row.cells[colId];
                    if (cell && cell.cellId) {
                      return {
                        cellId: cell.cellId,
                        columnId: colId,
                      };
                    } else {
                      return null;
                    }
                  })
                  .filter((cell) => cell !== null) as Array<{
                  cellId: string;
                  columnId: string;
                }>;

                // Call handleRunHypothesis only once with all cells
                handleRunHypothesis(
                  (column.metadata?.hypothesisId as string) ?? "",
                  cells
                );
              },
            },
            cellClass: "border-r border-[#E2E8F0] text-slate-700 pt-2.5",
            headerClass: "border-r border-[#E2E8F0]",
            cellStyle: {
              verticalAlign: "middle",
              textAlign: "left",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: wrapText ? "normal" : "nowrap",
            },
            autoHeight: wrapText,
          });
        }
      }
    });

    if (
      JSON.stringify(promptVersionTemplateData?.helicone_template)?.includes(
        "auto-inputs"
      )
    ) {
      // Add the "Messages" column
      columns.push({
        field: "messages",
        headerName: "Messages",
        width: 200,
        headerComponent: CustomHeaderComponent,
        headerComponentParams: {
          displayName: "Messages",
          badgeText: "Input",
          badgeVariant: "secondary",
          promptVersionTemplate: promptVersionTemplateData,
        },
        cellClass:
          "border-r border-[#E2E8F0] text-slate-700 flex items-center justify-start pt-2.5",
        headerClass,
        cellRenderer: OriginalMessagesCellRenderer,
        cellRendererParams: {
          prompt: promptVersionTemplateData,
          wrapText,
        },
        cellStyle: {
          verticalAlign: "middle",
          textAlign: "left",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: wrapText ? "normal" : "nowrap",
        },
        autoHeight: wrapText,
      });
    }

    columns.push({
      colId: "addExperiment",
      headerName: "Add Experiment",
      width: 170,
      suppressSizeToFit: true,
      suppressMenu: true,
      sortable: false,
      filter: false,
      resizable: false,
      headerComponent: AddColumnHeader,
      headerClass: "border-r border-[#E2E8F0]",
      headerComponentParams: headerComponentParams,
    });

    // Update column widths based on the columnWidths state
    columns.forEach((col) => {
      if (col.field && columnWidths[col.field]) {
        col.width = columnWidths[col.field];
      }
    });

    // Sort columns based on columnOrder if it's not empty
    if (columnOrder.length > 0) {
      columns = columns.sort((a, b) => {
        const aIndex = columnOrder.indexOf(a.field!);
        const bIndex = columnOrder.indexOf(b.field!);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    }

    return columns;
  }, [
    headerClass,
    wrapText,
    experimentTableQuery?.columns,
    columnView,
    columnWidths,
    headerComponentParams,
  ]);

  const [showRandomInputSelector, setShowRandomInputSelector] = useState(false);

  const handleRunRow = useCallback(
    (rowIndex: number) => {
      const row = experimentTableQuery?.rows.find(
        (row) => row.rowIndex === rowIndex
      );
      if (!row) return;

      const experimentColumns = experimentTableQuery?.columns?.filter(
        (column) => column.columnType === "experiment"
      );

      if (!experimentColumns) return;

      experimentColumns.forEach((column) => {
        const hypothesisId = (column.metadata?.hypothesisId as string) ?? "";
        if (!hypothesisId) return;

        const cells = [
          {
            cellId: row.cells[column.id].cellId,
            columnId: column.id,
          },
        ];

        handleRunHypothesis(hypothesisId, cells);
      });
    },
    [
      experimentTableQuery?.rows,
      experimentTableQuery?.columns,
      handleRunHypothesis,
    ]
  );

  const { setCurrentStep, currentStep, isOnboardingVisible } =
    useOnboardingContext();

  // const jawn = useJawnClient();
  // const [onboardingAddedRows, setOnboardingAddedRows] = useState(false);

  // // Fetch input records using useQuery
  // const {
  //   data: inputRecordsData,
  //   isLoading,
  //   isError,
  // } = useQuery(
  //   ["inputRecords", promptSubversionId],
  //   async () => {
  //     const res = await jawn.POST(
  //       "/v1/prompt/version/{promptVersionId}/inputs/query",
  //       {
  //         params: {
  //           path: {
  //             promptVersionId: promptSubversionId ?? "",
  //           },
  //         },
  //         body: {
  //           limit: 1000, // Adjust limit as needed
  //         },
  //       }
  //     );
  //     return res.data?.data ?? [];
  //   },
  //   {
  //     enabled: isOnboardingVisible && promptSubversionId !== undefined, // Fetch only when the drawer is open
  //   }
  // );

  // // Process input records
  // const inputRecords = useMemo(() => {
  //   if (!inputRecordsData) return [];
  //   return inputRecordsData.map((record) => ({
  //     id: record.id,
  //     inputs: record.inputs,
  //     source_request: record.source_request,
  //     prompt_version: record.prompt_version,
  //     created_at: record.created_at,
  //     response: record.response_body,
  //   }));
  // }, [inputRecordsData]);

  // useEffect(() => {
  //   console.log(
  //     inputRecords.length > 0,
  //     experimentTableQuery?.rows.length === 0,
  //     !isExperimentTableLoading,
  //     !isExperimentTableRefetching,
  //     isOnboardingVisible,
  //     org?.currentOrg?.tier === "demo"
  //   );
  //   if (
  //     inputRecords.length > 0 &&
  //     !isExperimentTableLoading &&
  //     !isExperimentTableRefetching &&
  //     experimentTableQuery?.rows.length === 0 &&
  //     isOnboardingVisible &&
  //     org?.currentOrg?.tier === "demo" &&
  //     !onboardingAddedRows
  //   ) {
  //     console.log("adding rows once");
  //     handleAddRowInsertBatch(
  //       inputRecords.map((record) => ({
  //         inputRecordId: record.id,
  //         datasetId: experimentTableQuery?.datasetId ?? "",
  //         inputs: record.inputs,
  //       }))
  //     );
  //     setOnboardingAddedRows(true);
  //     refetchExperimentTable();
  //   }
  // }, [
  //   inputRecords,
  //   handleAddRowInsertBatch,
  //   experimentTableQuery?.rows,
  //   experimentTableQuery?.datasetId,
  //   isExperimentTableLoading,
  //   refetchExperimentTable,
  //   isExperimentTableRefetching,
  //   isOnboardingVisible,
  //   org?.currentOrg?.tier,
  //   onboardingAddedRows,
  // ]);

  if (isExperimentTableLoading) {
    return (
      <div className="flex items-center justify-center h-screen flex-col">
        <LoadingAnimation />
        <h1 className="text-4xl font-semibold">Getting your experiments</h1>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="flex flex-col space-y-1 w-full">
        <div className="flex flex-row space-x-2 justify-end w-full pr-4">
          <Button
            variant="outline"
            className="py-0 px-2 border border-slate-200 h-8 items-center justify-center space-x-1 flex gap-2"
            onClick={() => setShowScoresTable(!showScoresTable)}
          >
            <div>{"{ }"}</div> {showScoresTable ? "Hide" : "Show"} Scores
          </Button>
          <ColumnsDropdown
            wrapText={wrapText}
            setWrapText={setWrapText}
            columnView={columnView}
            setColumnView={setColumnView}
          />
          <ExportButton
            className="py-0 px-2 border border-slate-200 h-8 flex items-center justify-center space-x-1 bg-white"
            key="export-button"
            rows={experimentTableQuery?.rows ?? []}
          />
          {!experimentTableQuery?.metadata?.experimentId && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="py-0 px-2 border border-slate-200 h-8 flex items-center justify-center space-x-1 gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  New Experiment
                </Button>
              </PopoverTrigger>
              <NewExperimentPopover />
            </Popover>
          )}
        </div>

        {showScoresTable && experimentTableQuery?.experimentId && (
          <div className="w-full bg-white border-y border-r">
            <div className="flex justify-between items-center bg-white p-2 border-b">
              <ScoresEvaluatorsConfig
                experimentId={experimentTableQuery?.experimentId ?? ""}
              />
            </div>
            <ScoresTableContainer
              columnDefs={columnDefs}
              columnWidths={columnWidths}
              columnOrder={columnOrder}
              experimentId={experimentTableQuery?.experimentId ?? ""}
              fetchExperimentHypothesisScores={fetchExperimentHypothesisScores}
            />
          </div>
        )}

        <Popover
          open={
            isOnboardingVisible &&
            currentStep === ONBOARDING_STEPS.EXPERIMENTS_TABLE.stepNumber
            //  &&
            // !!experimentTableQuery?.rows.length
          }
        >
          <PopoverTrigger asChild>
            <div
              data-onboarding-step={
                ONBOARDING_STEPS.EXPERIMENTS_TABLE.stepNumber
              }
              className="ag-theme-alpine w-full overflow-hidden "
              ref={experimentTableRef}
              style={
                {
                  "--ag-header-height": "40px",
                  "--ag-header-background-color": "#f3f4f6", // Light gray background
                  "--ag-header-foreground-color": "#1f2937", // Dark gray text
                  "--ag-header-cell-hover-background-color": "#e5e7eb", // Slightly darker gray on hover
                  "--ag-header-column-separator-color": "#d1d5db", // Medium gray for separators
                  "--ag-cell-horizontal-border": "solid #E2E8F0",
                  "--ag-border-color": "#E2E8F0",
                  "--ag-borders": "none",
                } as React.CSSProperties
              }
            >
              <AgGridReact
                ref={gridRef as any}
                rowData={experimentTableQuery?.rows}
                columnDefs={columnDefs}
                onGridReady={onGridReady}
                onColumnResized={onColumnResized}
                onColumnMoved={onColumnMoved}
                enableCellTextSelection={true}
                suppressRowTransform={true}
                suppressColumnVirtualisation={true}
                suppressColumnMoveAnimation={true}
                domLayout="autoHeight"
                // getRowId={getRowId}
                context={{
                  handleRunHypothesis,
                  setShowExperimentInputSelector,
                  setShowRandomInputSelector,
                  experimentTableData: experimentTableQuery,
                  hypotheses: [],
                  experimentId: experimentTableQuery?.metadata?.experimentId,
                  orgId,
                  promptVersionTemplateRef: promptVersionTemplateData ?? {},

                  rowData: experimentTableQuery?.rows,
                  handleUpdateExperimentCell: updateExperimentCell.mutate,
                  handleRunRow,
                }}
                rowClass="border-b border-gray-200 hover:bg-gray-50"
                headerHeight={40}
                rowHeight={50}
              />
            </div>
          </PopoverTrigger>
          <OnboardingPopover
            onboardingStep="EXPERIMENTS_TABLE"
            align="start"
            side="bottom"
            className="z-[10000] bg-white p-4 w-[calc(100vw-2rem)] sm:max-w-md flex flex-col gap-2"
          />
        </Popover>
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
              handleAddRow={handleAddRow}
            />
          </PopoverContent>
        </Popover>
      </div>

      <ExperimentRandomInputSelector
        open={showRandomInputSelector}
        setOpen={setShowRandomInputSelector}
        handleAddRows={handleAddRowInsertBatch}
        promptVersionId={promptSubversionId}
        datasetId={experimentTableQuery?.datasetId ?? ""}
        onSuccess={async (success) => {}}
      />

      <ExperimentInputSelector
        open={showExperimentInputSelector}
        setOpen={setShowExperimentInputSelector}
        promptVersionId={promptSubversionId}
        datasetId={experimentTableQuery?.datasetId ?? ""}
        handleAddRows={handleAddRowInsertBatch}
        onSuccess={async (success) => {}}
      />
    </div>
  );
}
