import React, { useRef, useEffect } from "react";
import { useOrg } from "@/components/layout/organizationContext";
import { Button } from "@/components/ui/button";
import { getJawnClient } from "@/lib/clients/jawn";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useQuery } from "@tanstack/react-query";
import {
  ColDef,
  GridReadyEvent,
  ColumnResizedEvent,
  ColumnMovedEvent,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useMemo, useState } from "react";
import AddColumnHeader from "./AddColumnHeader";
import { HypothesisCellRenderer } from "./HypothesisCellRenderer";
import {
  PlusIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import ExperimentInputSelector from "../experimentInputSelector";
import { useMutation } from "@tanstack/react-query";

import SettingsPanel from "./components/settingsPannel";
import {
  InputCellRenderer,
  CustomHeaderComponent,
  RowNumberHeaderComponent,
  RowNumberCellRenderer,
} from "./components/tableElementsRenderer";
import {
  ColumnsDropdown,
  ProviderKeyDropdown,
} from "./components/customButtonts";
import ScoresTable from "./ScoresTable";

interface ExperimentTableProps {
  promptSubversionId: string;
  experimentId: string;
}

export function ExperimentTable({
  promptSubversionId,
  experimentId,
}: ExperimentTableProps) {
  const org = useOrg();
  const orgId = org?.currentOrg?.id;
  const jawn = useJawnClient();

  const [wrapText, setWrapText] = useState(false);
  const [columnView, setColumnView] = useState<"all" | "inputs" | "outputs">(
    "all"
  );
  const [showScoresTable, setShowScoresTable] = useState(false);

  // State to control ExperimentInputSelector
  const [showExperimentInputSelector, setShowExperimentInputSelector] =
    useState(false);

  const experimentTableRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<any>(null);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
    gridRef.current = params.api;
  }, []);

  const fetchExperiments = useCallback(async () => {
    if (!orgId || !experimentId) return null;
    const jawnClient = getJawnClient(orgId);
    const res = await jawnClient.POST("/v1/experiment/query", {
      body: {
        filter: {
          experiment: {
            id: {
              equals: experimentId,
            },
          },
        },
        include: {
          responseBodies: true,
          promptVersion: true,
        },
      },
    });

    return res.data?.data?.[0];
  }, [orgId, experimentId]);

  const { data: experimentData, refetch: refetchExperiments } = useQuery(
    ["experiments", orgId, experimentId],
    fetchExperiments
  );

  const providerKey = useMemo(
    () => (experimentData?.meta as any)?.provider_key,
    [experimentData]
  );

  const fetchInputRecords = useCallback(async () => {
    const datasetId = experimentData?.dataset.id;
    if (!orgId || !datasetId) return [];
    const jawnClient = getJawnClient(orgId);
    const res = await jawnClient.POST(
      "/v1/experiment/dataset/{datasetId}/inputs/query",
      {
        params: {
          path: {
            datasetId,
          },
        },
      }
    );
    return res.data?.data;
  }, [orgId, experimentData?.dataset?.id]);

  const fetchPromptVersionTemplate = useCallback(async () => {
    const jawnClient = getJawnClient(orgId);
    const res = await jawnClient.GET("/v1/prompt/version/{promptVersionId}", {
      params: {
        path: {
          promptVersionId: promptSubversionId,
        },
      },
    });
    return res.data?.data;
  }, [orgId, promptSubversionId]);

  const fetchRandomInputRecords = useCallback(async () => {
    const jawnClient = getJawnClient(orgId);
    const res = await jawnClient.POST(
      "/v1/prompt/version/{promptVersionId}/inputs/query",
      {
        params: {
          path: {
            promptVersionId: promptSubversionId,
          },
        },
        body: {
          limit: 100,
          random: true,
        },
      }
    );

    return res.data?.data;
  }, [orgId, promptSubversionId]);

  const { data: inputRecordsData, refetch: refetchInputRecords } = useQuery(
    ["inputRecords", orgId, experimentData?.dataset?.id],
    fetchInputRecords,
    {
      enabled: !!experimentData?.dataset?.id,
    }
  );

  const { data: randomInputRecordsData } = useQuery(
    ["randomInputRecords", orgId, promptSubversionId],
    fetchRandomInputRecords,
    {
      enabled: true,
    }
  );

  const { data: promptVersionTemplateData } = useQuery(
    ["promptVersionTemplate", orgId, promptSubversionId],
    fetchPromptVersionTemplate,
    {
      enabled: true,
    }
  );

  const promptVersionTemplate = useMemo(() => {
    return promptVersionTemplateData;
  }, [promptVersionTemplateData]);

  const randomInputRecords = useMemo(() => {
    return (
      randomInputRecordsData?.map((row) => ({
        id: row.id,
        inputs: row.inputs,
        source_request: row.source_request,
        prompt_version: row.prompt_version,
        created_at: row.created_at,
        response: row.response_body,
      })) ?? []
    );
  }, [randomInputRecordsData]);

  // Use useState to manage rowData
  const [rowData, setRowData] = useState<any[]>([]);
  // Keep track of all input keys
  const [inputKeys, setInputKeys] = useState<Set<string>>(new Set(["Input 1"]));

  // Function to update rowData based on fetched data
  const updateRowData = useCallback(
    (experimentData: any, inputRecordsData: any[]) => {
      const newInputKeys = new Set<string>();
      if (inputRecordsData && inputRecordsData.length > 0) {
        inputRecordsData.forEach((row) => {
          Object.keys(row.inputs).forEach((key) => newInputKeys.add(key));
        });
      }

      if (newInputKeys.size === 0) {
        newInputKeys.add("Input 1");
      }

      setInputKeys(newInputKeys);

      const newRowData = inputRecordsData.map((row, rowIdx) => {
        const hypothesisRowData: Record<string, string> = {};

        // Always populate "Messages" and "Original" columns
        hypothesisRowData["messages"] = JSON.stringify(
          //@ts-ignore
          promptVersionTemplate?.helicone_template?.messages?.[0] || {},
          null,
          2
        );
        hypothesisRowData["original"] =
          row?.request_response_body?.choices?.[0]?.message?.content || "";

        // Add data for other hypotheses if they exist
        experimentData.hypotheses.slice(1).forEach((hypothesis: any) => {
          const hypothesisRun = hypothesis.runs?.find(
            (r: any) => r.datasetRowId === row.dataset_row_id
          );
          if (hypothesisRun) {
            hypothesisRowData[hypothesis.id] = JSON.stringify(
              hypothesisRun.response,
              null,
              2
            );
          }
        });

        return {
          id: row.id,
          dataset_row_id: row.dataset_row_id,
          // Spread inputs to individual fields
          ...row.inputs,
          ...hypothesisRowData,
          isLoading: {},
        };
      });

      setRowData(newRowData);
    },
    [setInputKeys, setRowData, promptVersionTemplate]
  );

  // Add useEffect to update rowData when experimentData or inputRecordsData change
  useEffect(() => {
    if (experimentData && inputRecordsData) {
      updateRowData(experimentData, inputRecordsData);
    }
  }, [experimentData, inputRecordsData, updateRowData]);

  // Add an empty row if rowData is empty
  useEffect(() => {
    if (rowData.length === 0) {
      const inputFields = Array.from(inputKeys).reduce((acc, key) => {
        acc[key] = "";
        return acc as Record<string, string>;
      }, {} as Record<string, string>);

      const newRow = {
        id: `temp-${Date.now()}`,
        dataset_row_id: null,
        ...inputFields,
        isLoading: {},
      };

      setRowData([newRow]);
    }
  }, [inputKeys, rowData.length]);

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: false,
      resizable: true,
      wrapText: wrapText,
      autoHeight: wrapText,
      cellStyle: {
        wordBreak: "normal",
        whiteSpace: wrapText ? "normal" : "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },
      // Add cellClass and headerClass to apply borders
      cellClass: "border-r border-[#E2E8F0]",
      headerClass: "border-r border-[#E2E8F0]",
    }),
    [wrapText]
  );
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  const getRowId = useCallback((params: any) => params.data.id, []);

  const runHypothesisMutation = useMutation(
    async ({
      hypothesisId,
      datasetRowIds,
    }: {
      hypothesisId: string;
      datasetRowIds: string[];
    }) => {
      await jawn.POST("/v1/experiment/run", {
        body: {
          experimentId,
          hypothesisId,
          datasetRowIds,
        },
      });
    },
    {
      onMutate: ({ hypothesisId, datasetRowIds }) => {
        // Set loading state in rowData
        setRowData((prevData) =>
          prevData.map((row) => {
            if (datasetRowIds.includes(row.dataset_row_id)) {
              return {
                ...row,
                isLoading: {
                  ...(row.isLoading || {}),
                  [hypothesisId]: true,
                },
              };
            }
            return row;
          })
        );
      },
      onSettled: async (_, __, { hypothesisId, datasetRowIds }) => {
        // Refetch data
        await refetchExperiments();
        await refetchInputRecords();

        // Reset loading state in rowData
        setRowData((prevData) =>
          prevData.map((row) => {
            if (datasetRowIds.includes(row.dataset_row_id)) {
              const newIsLoading = { ...(row.isLoading || {}) };
              delete newIsLoading[hypothesisId];
              return {
                ...row,
                isLoading: newIsLoading,
              };
            }
            return row;
          })
        );
      },
      onError: (error) => {
        console.error("Error running hypothesis:", error);
      },
    }
  );

  const handleRunHypothesis = useCallback(
    (hypothesisId: string, datasetRowIds: string[]) => {
      runHypothesisMutation.mutate({ hypothesisId, datasetRowIds });
    },
    [runHypothesisMutation]
  );
  const handleAddRow = useCallback(() => {
    const newRowId = `temp-${Date.now()}`;

    // Initialize input fields with empty strings
    const inputFields = Array.from(inputKeys).reduce((acc, key) => {
      acc[key] = "";
      return acc as Record<string, string>;
    }, {} as Record<string, string>);

    // Create an empty row object
    const newRow = {
      id: newRowId,
      dataset_row_id: null,
      ...inputFields, // Include input fields
      // Initialize hypothesis fields as empty strings
      ...experimentData?.hypotheses.reduce((acc, hypothesis) => {
        acc[hypothesis.id] = "";
        return acc;
      }, {} as Record<string, string>),
    };

    // Add the new row to the rowData state
    setRowData((prevData) => [...prevData, newRow]);
  }, [experimentData?.hypotheses, inputKeys]);

  const refetchData = () => {
    refetchExperiments();
    refetchInputRecords();
  };

  // Determine the hypotheses to run (excluding the first one)
  const hypothesesToRun = useMemo(() => {
    return experimentData?.hypotheses.slice(1).map((h: any) => h.id) || [];
  }, [experimentData?.hypotheses]);

  // Define sortedHypotheses
  const sortedHypotheses = useMemo(() => {
    return experimentData?.hypotheses
      ? [...experimentData.hypotheses].sort((a, b) => {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        })
      : [];
  }, [experimentData?.hypotheses]);

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
        headerClass:
          "border-r border-[#E2E8F0] text-center items-center justify-center",
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        autoHeight: wrapText,
      },
    ];

    // Add columns for each input key
    Array.from(inputKeys).forEach((key, index) => {
      columns.push({
        field: key,
        headerName: key,
        width: 150,
        cellRenderer: InputCellRenderer,
        cellRendererParams: {
          index: index,
        },
        cellClass: "border-r border-[#E2E8F0] text-slate-700",
        headerClass: "border-r border-[#E2E8F0]",
        headerComponent: CustomHeaderComponent,
        headerComponentParams: {
          index: index,
          displayName: key,
          badgeText: "Input",
        },
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "start",
        },
        autoHeight: wrapText,
      });
    });

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
        hypothesis: sortedHypotheses[0] || {},
      },
      cellClass:
        "border-r border-[#E2E8F0] text-slate-700 flex items-center justify-start pt-2.5",
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

    // Add the "Original" column
    columns.push({
      field: "original",
      headerName: "Original",
      width: 200,
      headerComponent: CustomHeaderComponent,
      headerComponentParams: {
        displayName: "Original",
        badgeText: "Output",
        badgeVariant: "secondary",
        hypothesis: sortedHypotheses[1] || {},
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

    // Add columns for additional experiments
    if (columnView === "all" || columnView === "outputs") {
      sortedHypotheses.slice(1).forEach((hypothesis, index) => {
        const experimentNumber = index + 1;
        columns.push({
          field: hypothesis.id,
          headerName: hypothesis.id,
          width: 230,
          suppressSizeToFit: true,
          cellRenderer: HypothesisCellRenderer,
          cellRendererParams: {
            hypothesisId: hypothesis.id,
            handleRunHypothesis,
            loadingStates,
          },
          headerComponent: CustomHeaderComponent,
          headerComponentParams: {
            displayName: `Experiment ${experimentNumber}`,
            badgeText: "Output",
            badgeVariant: "secondary",
            onRunColumn: (colId: string) => {
              const datasetRowIds = rowData.map((row) => row.dataset_row_id);
              handleRunHypothesis(colId, datasetRowIds);
            },
            hypothesis: hypothesis,
          },
          cellClass: "border-r border-[#E2E8F0] text-slate-700 pt-2.5",
          headerClass: "border-r border-[#E2E8F0] bg-white dark:bg-gray-800",
          cellStyle: {
            verticalAlign: "middle",
            textAlign: "left",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: wrapText ? "normal" : "nowrap",
          },
          autoHeight: wrapText,
        });
      });
    }

    // Add the "Add Experiment" column
    columns.push({
      headerName: "Add Experiment",
      width: 150,
      suppressSizeToFit: true,
      suppressMenu: true,
      sortable: false,
      filter: false,
      resizable: false,
      headerComponent: AddColumnHeader,
      headerComponentParams: {
        promptVersionId: promptSubversionId,
        experimentId,
        selectedProviderKey: providerKey,
        refetchData,
      },
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
    sortedHypotheses,
    columnView,
    handleRunHypothesis,
    loadingStates,
    rowData,
    wrapText,
    inputKeys,
    columnWidths,
    columnOrder,
  ]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedProviderKey, setSelectedProviderKey] = useState(providerKey);

  return (
    <div className="relative w-full">
      <div className="flex flex-col space-y-2 w-full">
        <div className="flex flex-row space-x-2 justify-end w-full">
          <Button
            variant="outline"
            className="py-0 px-2 border border-slate-200 h-8 flex items-center justify-center space-x-1 flex gap-2"
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
          <Button
            variant="outline"
            className="py-0 px-2 border border-slate-200 h-8 flex items-center justify-center space-x-1"
          >
            <FunnelIcon className="h-4 w-4 text-slate-700" />
            <ChevronDownIcon className="h-4 w-4 text-slate-400" />
          </Button>
          <Button
            variant="outline"
            className="py-0 px-2 border border-slate-200 h-8 flex items-center justify-center space-x-1"
          >
            <ArrowDownTrayIcon className="h-4 w-4 text-slate-700" />
          </Button>
          <ProviderKeyDropdown
            providerKey={selectedProviderKey}
            setProviderKey={setSelectedProviderKey}
          />
          {/* <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            Settings
          </Button> */}
        </div>
        {showScoresTable && (
          <ScoresTable
            columnDefs={columnDefs}
            wrapText={wrapText}
            columnWidths={columnWidths}
            columnOrder={columnOrder}
          />
        )}
        <div
          className="ag-theme-alpine w-full rounded-md overflow-hidden"
          ref={experimentTableRef}
          style={
            {
              "--ag-header-height": "40px",
              "--ag-header-foreground-color": "#000",
              "--ag-header-background-color": "#ffffff",
              "--ag-header-cell-hover-background-color": "#e5e7eb",
              "--ag-header-cell-moving-background-color": "#d1d5db",
              "--ag-cell-horizontal-border": "solid #E2E8F0",
              "--ag-border-radius": "8px",
              "--ag-border-color": "#E2E8F0",
            } as React.CSSProperties
          }
        >
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            onGridReady={onGridReady}
            onColumnResized={onColumnResized}
            onColumnMoved={onColumnMoved}
            enableCellTextSelection={true}
            colResizeDefault="shift"
            suppressRowTransform={true}
            domLayout="autoHeight"
            getRowId={getRowId}
            context={{
              setShowExperimentInputSelector,
              handleRunHypothesis,
              hypothesesToRun,
              inputKeys: Array.from(inputKeys),
              hypotheses: sortedHypotheses,
            }}
            rowClass="border-b border-gray-200 hover:bg-gray-50"
            headerHeight={40}
            rowHeight={50}
          />
        </div>
        <Button
          variant="ghost"
          onClick={handleAddRow}
          className="max-w-32 flex flex-row space-x-2 text-md text-[#334155]"
        >
          <PlusIcon className="h-6 w-6" />
          Add row
        </Button>
      </div>

      <SettingsPanel
        defaultProviderKey={providerKey}
        setSelectedProviderKey={async (key) => {
          await jawn.POST("/v1/experiment/update-meta", {
            body: {
              experimentId,
              meta: {
                ...(experimentData?.meta ?? {}),
                provider_key: key ?? "",
              },
            },
          });
          refetchExperiments();
        }}
        open={settingsOpen}
        setOpen={setSettingsOpen}
      />

      {/* Include the ExperimentInputSelector */}
      <ExperimentInputSelector
        open={showExperimentInputSelector}
        setOpen={setShowExperimentInputSelector}
        meta={{
          promptVersionId: promptSubversionId,
          datasetId: experimentData?.dataset?.id,
        }}
        requestIds={randomInputRecords}
        onSuccess={(success) => {
          if (success) {
            // Handle success: Re-fetch experiments and input records
            refetchExperiments();
            refetchInputRecords();
          }
        }}
      />
    </div>
  );
}
