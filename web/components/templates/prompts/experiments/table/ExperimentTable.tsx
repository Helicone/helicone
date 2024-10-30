import { useOrg } from "@/components/layout/organizationContext";
import { Button } from "@/components/ui/button";
import { getJawnClient } from "@/lib/clients/jawn";
import { useJawnClient } from "@/lib/clients/jawnHook";
import {
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  GridApi,
  GridReadyEvent,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import { AgGridReact } from "ag-grid-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AddColumnHeader from "./AddColumnHeader";
import { HypothesisCellRenderer } from "./cells/HypothesisCellRenderer";
import { OriginalMessagesCellRenderer } from "./cells/OriginalMessagesCellRenderer";
import { OriginalOutputCellRenderer } from "./cells/OriginalOutputCellRenderer";

import { PlusIcon } from "@heroicons/react/24/outline";
import ExperimentInputSelector from "../experimentInputSelector";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useLocalStorage } from "@/services/hooks/localStorage";
import LoadingAnimation from "../../../../shared/loadingAnimation";
import ExportButton from "../../../../shared/themed/table/exportButton";
import { ColumnsDropdown } from "./components/customButtonts";
import {
  CustomHeaderComponent,
  InputCellRenderer,
  InputsHeaderComponent,
  RowNumberCellRenderer,
  RowNumberHeaderComponent,
} from "./components/tableElementsRenderer";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import clsx from "clsx";
import ScoresEvaluatorsConfig from "./scores/ScoresEvaluatorsConfig";
import { ExperimentRandomInputSelector } from "../experimentRandomInputSelector";
import ScoresTableContainer from "./scores/ScoresTableContainer";
import { NewExperimentPopover } from "./components/newExperimentPopover";
import { fetchRequestResponseBody } from "./utils/requestDataFetch";

interface ExperimentTableProps {
  promptSubversionId?: string;
  experimentId?: string;
}

const REFRESH_INTERVAL = 3000;

export function ExperimentTable({
  promptSubversionId,
  experimentId,
}: ExperimentTableProps) {
  const org = useOrg();
  const orgId = org?.currentOrg?.id;
  const jawn = useJawnClient();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [wrapText, setWrapText] = useState(false);
  const [columnView, setColumnView] = useState<"all" | "inputs" | "outputs">(
    "all"
  );
  const [showScoresTable, setShowScoresTable] = useLocalStorage(
    "showScoresTable",
    false
  );

  const [isHypothesisRunning, setIsHypothesisRunning] = useState(false);

  const [showExperimentInputSelector, setShowExperimentInputSelector] =
    useState(false);

  const experimentTableRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<GridApi | null>(null);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridRef.current = params.api;
  }, []);

  const fetchExperimentTable = useCallback(async () => {
    if (!orgId || !experimentId) return null;

    const jawnClient = getJawnClient(orgId);
    const res = await jawnClient.POST(
      "/v1/experiment/table/{experimentId}/query",
      {
        params: {
          path: {
            experimentId: experimentId,
          },
        },
      }
    );

    return res.data?.data;
  }, [orgId, experimentId]);

  const { data: experimentTableData, refetch: refetchExperimentTable } =
    useQuery(["experimentTable", orgId, experimentId], fetchExperimentTable, {
      enabled: !!orgId && !!experimentId,
    });

  const inputColumns = useMemo(() => {
    return (
      experimentTableData?.columns.filter(
        (column) => column.columnType === "input"
      ) ?? []
    );
  }, [experimentTableData]);

  const inputColumnNameToId = useMemo(() => {
    const map: Record<string, string> = {};
    inputColumns.forEach((column) => {
      map[column.columnName] = column.id;
    });
    return map;
  }, [inputColumns]);

  const handleAddColumn = useCallback(
    async (
      columnName: string,
      columnType: string,
      hypothesisId?: string,
      promptVersionId?: string
    ) => {
      const res = await jawn.POST(
        "/v1/experiment/table/{experimentTableId}/column",
        {
          params: {
            path: { experimentTableId: experimentTableData?.id || "" },
          },
          body: {
            columnName,
            columnType,
            hypothesisId,
            promptVersionId,
          },
        }
      );

      if (res.error) {
        console.error("Error adding column:", res);
      }
    },
    [jawn, refetchExperimentTable, experimentTableData?.id]
  );

  const fetchInputRecords = useCallback(async () => {
    const datasetId = experimentTableData?.metadata?.datasetId as string;
    if (!orgId || !datasetId || !promptSubversionId) return [];
    const jawnClient = getJawnClient(orgId);
    const res = await jawnClient.POST(
      "/v1/experiment/dataset/{datasetId}/inputs/query",
      {
        params: {
          path: {
            datasetId: datasetId,
          },
        },
      }
    );
    return res.data?.data;
  }, [orgId, experimentTableData?.metadata?.datasetId, promptSubversionId]);

  const fetchPromptVersionTemplate = useCallback(async () => {
    const jawnClient = getJawnClient(orgId);
    const res = await jawnClient.GET("/v1/prompt/version/{promptVersionId}", {
      params: {
        path: {
          promptVersionId: promptSubversionId ?? "",
        },
      },
    });
    return res.data?.data;
  }, [orgId, promptSubversionId]);

  const { data: promptVersionTemplateData } = useQuery(
    ["promptVersionTemplate", promptSubversionId],
    fetchPromptVersionTemplate,
    {
      staleTime: Infinity, // Data will never be considered stale
      cacheTime: Infinity, // Keep the data in cache indefinitely
      enabled: !!orgId && !!promptSubversionId,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const promptVersionTemplate = promptVersionTemplateData;

  const promptVersionTemplateRef = useRef(promptVersionTemplate);

  // Update the ref when promptVersionTemplate changes
  useEffect(() => {
    promptVersionTemplateRef.current = promptVersionTemplate;
  }, [promptVersionTemplate]);

  const fetchRandomInputRecords = useCallback(async () => {
    const jawnClient = getJawnClient(orgId);
    const res = await jawnClient.POST(
      "/v1/prompt/version/{promptVersionId}/inputs/query",
      {
        params: {
          path: {
            promptVersionId: promptSubversionId ?? "",
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
    ["inputRecords", orgId, experimentTableData?.metadata?.datasetId],
    fetchInputRecords,
    {
      enabled:
        !!experimentTableData?.metadata?.datasetId && !!promptSubversionId,
    }
  );

  const mapInputRecordsToColumnsWithRowId = useCallback(
    (inputRecords: Record<string, string>, rowId: string, rowIndex: number) => {
      const result: Record<
        string,
        { columnId: string; value: string; rowIndex: number }
      > = {};

      Object.entries(inputRecords).forEach(([inputKey, value]) => {
        const columnId = inputColumnNameToId[inputKey];
        if (columnId) {
          result[inputKey] = {
            columnId,
            value,
            rowIndex,
          };
        } else {
          console.warn(`Column ID for input key "${inputKey}" not found.`);
        }
      });

      return result;
    },
    [inputColumnNameToId]
  );

  const { data: randomInputRecordsData } = useQuery(
    ["randomInputRecords", orgId, promptSubversionId],
    fetchRandomInputRecords,
    {
      enabled: true,
      refetchInterval: 10000,
    }
  );

  const randomInputRecords = useMemo(() => {
    return (
      randomInputRecordsData?.map((row, index) => ({
        id: row.id,
        inputs: mapInputRecordsToColumnsWithRowId(row.inputs, row.id, index),
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
  const [tempRowId, setTempRowId] = useState(0);
  const responseBodyCache = useRef<Record<string, any>>({});

  // After defining inputKeys
  const inputColumnFields = Array.from(inputKeys);

  const getRequestDataByIds = useCallback(
    async (requestIds: string[]) => {
      const jawnClient = getJawnClient(orgId);
      try {
        const res = await jawnClient.POST("/v1/request/query-ids", {
          body: { requestIds },
        });
        return res.data?.data;
      } catch (error) {
        console.error("Error fetching request data:", error);
        return [];
      }
    },
    [orgId]
  );

  const updateRowData = useCallback(async () => {
    if (!experimentTableData) {
      setRowData([]);
      return;
    }

    // Build a mapping of rowIndex to row object
    const rowIndexToRow = new Map<number, any>();

    // Collect requestIds for experiment columns
    const requestIdsToFetch = new Set<string>();

    experimentTableData.columns.forEach((column) => {
      const columnId = column.id;

      if (
        column.columnType === "experiment" ||
        column.columnType === "output"
      ) {
        // Process experiment columns
        column.cells.forEach((cell) => {
          const rowIndex = cell.rowIndex;
          let row = rowIndexToRow.get(rowIndex);
          if (!row) {
            row = {
              id: `row-${rowIndex}`,
              rowIndex,
              isLoading: {},
              cellId: `${columnId}_${rowIndex}`,
            };
            rowIndexToRow.set(rowIndex, row);
          }

          if (cell.requestId) {
            // Temporarily store requestId in the cell data
            row[columnId] = {
              requestId: cell.requestId,
              cellId: `${columnId}_${rowIndex}`,
            };
            requestIdsToFetch.add(cell.requestId);
          } else {
            row[columnId] = {
              requestId: null,
              cellId: `${columnId}_${rowIndex}`,
            };
          }
        });
      } else {
        // Non-experiment columns
        column.cells.forEach((cell) => {
          const rowIndex = cell.rowIndex;
          let row = rowIndexToRow.get(rowIndex);
          if (!row) {
            row = { id: `row-${rowIndex}`, rowIndex, isLoading: {} };
            rowIndexToRow.set(rowIndex, row);
          }

          // Set the value for the column in the row
          row[columnId] = cell.value;

          // Store requestId if needed
          if (cell.requestId) {
            row.requestId = cell.requestId;
          }
          if (cell.metadata && cell.metadata.datasetRowId) {
            row.dataset_row_id = cell.metadata.datasetRowId;
          }
        });
      }
    });

    // Fetch request data for experiment columns
    const requestDataMap = new Map<string, any>();
    if (requestIdsToFetch.size > 0) {
      const requestIdsArray = Array.from(requestIdsToFetch);

      // Fetch data for each requestId individually
      await Promise.all(
        requestIdsArray.map(async (requestId) => {
          const requestDataArray = await getRequestDataByIds([requestId]);
          if (requestDataArray && requestDataArray.length > 0) {
            requestDataMap.set(requestId, requestDataArray[0]);
          }
        })
      );
    }

    // Now construct the rowData array
    const newRowData = await Promise.all(
      Array.from(rowIndexToRow.values()).map(async (row) => {
        // Process experiment column data
        await Promise.all(
          experimentTableData.columns.map(async (column) => {
            const columnId = column.id;

            // If it's an experiment or output column
            if (
              column.columnType === "experiment" ||
              column.columnType === "output"
            ) {
              const cellData = row[columnId] as any;

              // Always initialize the column with the cellId from cellData
              if (!row[columnId] && cellData?.cellId) {
                row[columnId] = {
                  responseBody: null,
                  cellId: cellData.cellId, // Use the original cellId
                };
              }

              // If we have request data, process it
              if (cellData?.requestId) {
                const requestData = requestDataMap.get(cellData.requestId);
                if (requestData) {
                  const responseBody = await fetchRequestResponseBody(
                    requestData,
                    responseBodyCache
                  );
                  row[columnId] = {
                    responseBody,
                    cellId: cellData.cellId, // Always use the original cellId
                  };

                  // Refresh the cell if needed
                  if (gridRef.current) {
                    const rowNode = gridRef.current.getRowNode(row.id);
                    if (rowNode) {
                      gridRef.current.refreshCells({
                        rowNodes: [rowNode],
                        columns: [columnId],
                        force: true,
                      });
                    }
                  }
                }
              }
            }
          })
        );
        return row;
      })
    );

    // Sort rows by rowIndex
    newRowData.sort((a, b) => a.rowIndex - b.rowIndex);

    // Preserve isLoading state from previous rowData
    const updatedRowData = newRowData.map((newRow) => {
      // Find the matching row in the previous rowData
      const existingRow = rowDataRef.current.find(
        (row) => row.id === newRow.id
      );

      // If an existing row is found, preserve its isLoading state
      if (existingRow && existingRow.isLoading) {
        return {
          ...newRow,
          isLoading: existingRow.isLoading,
        };
      }
      // Otherwise, initialize isLoading as an empty object
      return {
        ...newRow,
        isLoading: {},
      };
    });

    setRowData(updatedRowData);
  }, [experimentTableData, getRequestDataByIds]);

  // Modify the useEffect that updates rowData
  useEffect(() => {
    if (experimentTableData && experimentTableData.columns.length > 0) {
      updateRowData().then(() => {
        setIsInitialLoading(false);
      });
    } else if (!experimentId) {
      // If there's no experimentId, set a default empty row
      const defaultInputKey = "Input 1";
      setRowData([
        {
          id: `temp-${Date.now()}`,
          [defaultInputKey]: "",
          isLoading: {},
        },
      ]);
      setIsInitialLoading(false); // Ensure we're not in a loading state
    }
  }, [experimentTableData, experimentId]);

  // Add a new useEffect to handle initial loading state
  useEffect(() => {
    if (!experimentId) {
      setIsInitialLoading(false);
    }
  }, [experimentId]);

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
      cellClass: "border-r border-[#E2E8F0]",
      headerClass: "border-r border-[#E2E8F0]",
    }),
    [wrapText]
  );

  const getRowId = useCallback((params: any) => params.data.id, []);

  const runHypothesisMutation = useMutation(
    async ({
      hypothesisId,
      cells,
    }: {
      hypothesisId: string;
      cells: Array<{
        rowIndex: number;
        datasetRowId: string;
        columnId: string;
        cellId: string;
      }>;
    }) => {
      await jawn.POST("/v1/experiment/run", {
        body: {
          experimentId: experimentId ?? "",
          hypothesisId,
          cells: cells.map((cell) => ({
            rowIndex: cell.rowIndex,
            datasetRowId: cell.datasetRowId,
            columnId: cell.columnId,
          })),
        },
      });
    },
    {
      onMutate: ({ cells, hypothesisId }) => {
        // Manually update isLoading in rowData for the specific cells
        setRowData((prevData) => {
          const newData = prevData.map((row) => {
            const matchingCell = cells.find(
              (cell) => cell.rowIndex === row.rowIndex
            );
            if (matchingCell) {
              const cellId = `${matchingCell.columnId}_${matchingCell.rowIndex}`;
              const newIsLoading = {
                ...(row.isLoading || {}),
                [cellId]: true, // Use combined cellId
              };
              return {
                ...row,
                isLoading: newIsLoading,
              };
            }
            return row;
          });
          return newData;
        });
        // Set isHypothesisRunning to true when the mutation starts
        setIsHypothesisRunning(true);
      },
      onError: (error, variables, context) => {
        // Handle error if needed
        // Set isHypothesisRunning to false if there's an error
        setIsHypothesisRunning(false);
      },
    }
  );

  const handleRunHypothesis = useCallback(
    (
      hypothesisId: string,
      cells: Array<{
        rowIndex: number;
        datasetRowId: string;
        columnId: string;
        cellId: string;
      }>
    ) => {
      runHypothesisMutation.mutate({ hypothesisId, cells });
    },
    [runHypothesisMutation]
  );

  const refetchData = async () => {
    await refetchExperimentTable();
    await refetchInputRecords();
  };

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

  const handleAddRow = useCallback(() => {
    const newRowId = `temp-${tempRowId}`;
    setTempRowId((prevId) => prevId + 1);

    const inputFields = Array.from(inputKeys).reduce((acc, key) => {
      acc[key] = "";
      return acc as Record<string, string>;
    }, {} as Record<string, string>);

    const newRow = {
      id: newRowId,
      dataset_row_id: null,
      ...inputFields,
      isLoading: {},
    };

    setRowData((prevData) => [...prevData, newRow]);
  }, [inputKeys, tempRowId]);

  const handleCellValueChanged = useCallback(
    (event: any) => {
      if (inputColumnFields.includes(event.colDef.field)) {
        const updatedRow = { ...event.data };
        setRowData((prevData) =>
          prevData.map((row) =>
            row.dataset_row_id === updatedRow.dataset_row_id ? updatedRow : row
          )
        );

        if (
          event.colDef.field === inputColumnFields[inputColumnFields.length - 1]
        ) {
          handleAddRow();
        }
      }
    },
    [inputColumnFields, handleAddRow]
  );

  const [activePopoverCell, setActivePopoverCell] = useState<{
    rowIndex: number;
    colId: string;
  } | null>(null);

  const [currentRowInputs, setCurrentRowInputs] = useState<
    Record<string, { columnId: string; value: string; rowIndex: number }>
  >({});

  const handleInputChange = useCallback(
    (key: string, value: string, columnId: string, rowIndex: number) => {
      setCurrentRowInputs((prev) => ({
        ...prev,
        [key]: { columnId, value: value.trim(), rowIndex },
      }));
    },
    []
  );

  // Modify handleLastInputSubmit to use input columns
  const handleLastInputSubmit = useCallback(
    async (rowIndex: number) => {
      const currentRowValues = Object.values(currentRowInputs)
        .filter((value) => value !== undefined && value !== null)
        .map((value) => String(value).trim());

      const allValuesFilled =
        currentRowValues.length > 0 &&
        !currentRowValues.some((value) => value === "");

      if (!allValuesFilled) {
        console.log(
          "Not all values are filled. Please fill all values before submitting."
        );
        return;
      }

      try {
        await jawn.POST(
          "/v1/experiment/dataset/{datasetId}/version/{promptVersionId}/row/new",
          {
            body: {
              inputs: currentRowInputs,
              rowIndex: rowIndex,
              experimentTableId: experimentTableData?.id ?? "",
              originalColumnId:
                experimentTableData?.columns.find(
                  (column) => column.columnType === "output"
                )?.id ?? undefined,
            },
            params: {
              path: {
                promptVersionId: promptSubversionId ?? "",
                datasetId:
                  (experimentTableData?.metadata?.datasetId as string) ?? "",
              },
            },
          }
        );

        // Clear the current row inputs after successful submission
        setCurrentRowInputs({});

        // Reset the activePopoverCell to prevent the popover from showing up
        setActivePopoverCell(null);

        // Refetch input records to update the table
        refetchInputRecords();
        refetchExperimentTable();
      } catch (error) {
        console.error("Error submitting row:", error);
      }
    },
    [
      currentRowInputs,
      jawn,
      promptSubversionId,
      experimentTableData?.metadata?.datasetId,
      inputKeys,
      refetchInputRecords,
      inputColumns,
    ]
  );

  // Adjust useEffect to add an empty row if rowData is empty
  useEffect(() => {
    if (rowData.length === 0) {
      const inputFields = Array.from(inputKeys).reduce((acc, key) => {
        acc[key] = "";
        return acc;
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
  const headerClass = clsx(
    "border-r border-[#E2E8F0] text-center items-center justify-center"
  );

  const fetchExperimentHypothesisScores = useCallback(
    async (hypothesisId: string) => {
      const result = await jawn.POST(
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
    [jawn]
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

    Array.from(experimentTableData?.columns || []).forEach((column, index) => {
      if (column.columnType === "input") {
        columns.push({
          field: column.id,
          headerName: column.columnName,
          width: 150,
          cellRenderer: InputCellRenderer,
          cellRendererParams: {
            index: index,
            wrapText,
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
            promptVersionId: promptVersionTemplateRef?.current?.id ?? "",
            promptVersionTemplate: promptVersionTemplateRef.current,
          },
          cellClass: "border-r border-[#E2E8F0] text-slate-700 pt-2.5",
          headerClass: headerClass,
          cellRenderer: OriginalOutputCellRenderer,
          cellRendererParams: {
            prompt: promptVersionTemplateRef.current,
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
              originalPromptTemplate: promptVersionTemplateRef.current,
              runs: column.cells.filter((cell) => cell.requestId),
              onRunColumn: async (colId: string) => {
                rowData.map(async (row, index) => {
                  const cells = [
                    {
                      rowIndex: index,
                      datasetRowId: row.dataset_row_id,
                      columnId: colId,
                      cellId: `${colId}_${index}`,
                    },
                  ];
                  handleRunHypothesis(
                    (column.metadata?.hypothesisId as string) ?? "",
                    cells
                  );
                });
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
      JSON.stringify(promptVersionTemplate?.helicone_template)?.includes(
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
          promptVersionTemplate: promptVersionTemplate,
        },
        cellClass:
          "border-r border-[#E2E8F0] text-slate-700 flex items-center justify-start pt-2.5",
        headerClass,
        cellRenderer: OriginalMessagesCellRenderer,
        cellRendererParams: {
          prompt: promptVersionTemplate,
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
      headerName: "Add Experiment",
      width: 170,
      suppressSizeToFit: true,
      suppressMenu: true,
      sortable: false,
      filter: false,
      resizable: false,
      headerComponent: AddColumnHeader,
      headerClass: "border-r border-[#E2E8F0]",
      headerComponentParams: {
        promptVersionId: promptSubversionId,
        promptVersionTemplate: promptVersionTemplate,
        experimentId,
        selectedProviderKey: "",
        refetchData,
        handleAddColumn,
        wrapText,
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
    columnView,
    handleRunHypothesis,
    rowData,
    wrapText,
    inputKeys,
    columnWidths,
    columnOrder,
    activePopoverCell,
    handleLastInputSubmit,
  ]);

  const [showRandomInputSelector, setShowRandomInputSelector] = useState(false);

  const getExperimentExportData = useCallback(() => {
    if (!rowData || rowData.length === 0) {
      return [];
    }

    const exportedData = rowData.map((row) => {
      const exportedRow: Record<string, any> = {};

      inputColumnFields.forEach((field) => {
        exportedRow[field] = row[field] || "";
      });

      exportedRow["messages"] = row["messages"] || "";

      exportedRow["original"] = row["original"] || "";

      return exportedRow;
    });

    return exportedData;
  }, [rowData, inputColumnFields]);

  // Add this new component

  // At the top of your component, create a ref to store rowData
  const rowDataRef = useRef(rowData);

  // Update the ref whenever rowData changes
  useEffect(() => {
    rowDataRef.current = rowData;
  }, [rowData]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isHypothesisRunning) {
      intervalId = setInterval(async () => {
        await refetchExperimentTable();
        await updateRowData();

        const latestRowData = rowDataRef.current;

        let anyLoadingCells = false; // Assume no cells are loading

        const newData = latestRowData.map((row) => {
          const newIsLoading = { ...(row.isLoading || {}) };

          Object.keys(newIsLoading).forEach((cellId) => {
            const [columnId, _] = cellId.split("_");
            const cellData = row[columnId]; // Use columnId

            if (cellData && cellData.responseBody) {
              delete newIsLoading[cellId];
            } else {
              anyLoadingCells = true; // Set to true if any cell is still loading
            }
          });

          return {
            ...row,
            isLoading: newIsLoading,
          };
        });

        setRowData(newData);

        if (!anyLoadingCells) {
          setIsHypothesisRunning(false);
        }

        gridRef.current?.refreshCells();
      }, REFRESH_INTERVAL);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isHypothesisRunning, refetchExperimentTable, updateRowData]);

  const handleRunRow = useCallback(
    (rowIndex: number) => {
      const rowDataItem = rowDataRef.current.find(
        (row) => row.rowIndex === rowIndex
      );
      if (!rowDataItem) {
        console.error(`Row with index ${rowIndex} not found.`);
        return;
      }

      const datasetRowId = rowDataItem.dataset_row_id;
      if (!datasetRowId) {
        console.error(`Dataset row ID not found for row index ${rowIndex}.`);
        return;
      }

      const hypothesesToRun =
        experimentTableData?.columns
          .filter(
            (column) =>
              column.metadata?.hypothesisId &&
              column.columnType === "experiment"
          )
          .map((column) => ({
            hypothesisId: column.metadata?.hypothesisId as string,
            columnId: column.id,
          })) || [];

      // Prepare cells to run
      const cells = hypothesesToRun.map((hypothesis) => {
        const cellId = `${hypothesis.columnId}_${rowIndex}`;
        return {
          hypothesisId: hypothesis.hypothesisId,
          cell: {
            rowIndex,
            datasetRowId,
            columnId: hypothesis.columnId,
            cellId,
          },
        };
      });

      cells.forEach((cell) => {
        handleRunHypothesis(cell.hypothesisId, [cell.cell]);
      });
    },
    [rowDataRef, experimentTableData, handleRunHypothesis]
  );

  if (isInitialLoading) {
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
            rows={getExperimentExportData()}
          />
          {!experimentId && (
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

        {showScoresTable && experimentId && (
          <div className="w-full bg-white border-y border-r">
            <div className="flex justify-between items-center bg-white p-2 border-b">
              <ScoresEvaluatorsConfig experimentId={experimentId} />
            </div>
            <ScoresTableContainer
              columnDefs={columnDefs}
              columnWidths={columnWidths}
              columnOrder={columnOrder}
              experimentId={experimentId}
              fetchExperimentHypothesisScores={fetchExperimentHypothesisScores}
            />
          </div>
        )}

        <div
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
            rowData={rowData}
            columnDefs={columnDefs}
            onGridReady={onGridReady}
            onColumnResized={onColumnResized}
            onColumnMoved={onColumnMoved}
            enableCellTextSelection={true}
            suppressRowTransform={true}
            suppressColumnVirtualisation={true}
            suppressColumnMoveAnimation={true}
            domLayout="autoHeight"
            getRowId={getRowId}
            context={{
              handleRunHypothesis,
              handleRunRow,
              hypothesesToRun:
                (experimentTableData?.columns
                  .filter((column) => column.metadata?.hypothesisId)
                  .map(
                    (column) => column.metadata?.hypothesisId
                  ) as string[]) || [],
              setShowExperimentInputSelector,
              setShowRandomInputSelector,
              inputKeys: Array.from(inputKeys),
              experimentTableData,
              inputColumnFields,
              hypotheses: [],
              experimentId,
              orgId,
              promptVersionTemplateRef,
              activePopoverCell,
              setActivePopoverCell,
              handleLastInputSubmit,
              handleInputChange,
              rowData, // Add this line
            }}
            rowClass="border-b border-gray-200 hover:bg-gray-50"
            headerHeight={40}
            rowHeight={50}
            onCellValueChanged={handleCellValueChanged}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddRow}
          className="self-start flex flex-row space-x-2 text-slate-700 mt-0"
        >
          <PlusIcon className="h-4 w-4" />
          Add row
        </Button>
      </div>

      <ExperimentRandomInputSelector
        open={showRandomInputSelector}
        setOpen={setShowRandomInputSelector}
        numberOfRows={rowData.length}
        meta={{
          promptVersionId: promptSubversionId,
          datasetId: (experimentTableData?.metadata?.datasetId as string) ?? "",
          originalColumnId:
            experimentTableData?.columns?.find(
              (column) => column.id === "output"
            )?.id ?? "",
        }}
        requestIds={randomInputRecords}
        onSuccess={async (success) => {
          if (success) {
            await refetchExperimentTable();
            await refetchInputRecords();
            setShowRandomInputSelector(false);
          }
        }}
      />

      <ExperimentInputSelector
        open={showExperimentInputSelector}
        setOpen={setShowExperimentInputSelector}
        setShowRandomInputSelector={setShowRandomInputSelector}
        meta={{
          promptVersionId: promptSubversionId,
          datasetId: (experimentTableData?.metadata?.datasetId as string) ?? "",
          originalColumnId:
            experimentTableData?.columns?.find(
              (column) => column.id === "output"
            )?.id ?? "",
        }}
        numberOfRows={rowData.length}
        requestIds={randomInputRecords}
        onSuccess={async (success) => {
          if (success) {
            await refetchExperimentTable();
            await refetchInputRecords();
          }
        }}
      />
    </div>
  );
}
