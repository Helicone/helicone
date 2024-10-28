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
import {
  HypothesisCellRenderer,
  OriginalMessagesCellRenderer,
  OriginalOutputCellRenderer,
} from "./HypothesisCellRenderer";
import { BeakerIcon, PlusIcon } from "@heroicons/react/24/outline";
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
import ScoresTable from "./scores/ScoresTable";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import PromptPlayground, {
  PromptObject,
  Input as PromptInput,
} from "../../id/promptPlayground";

import { Input } from "../../../../ui/input";
import useNotification from "../../../../shared/notification/useNotification";
import { useRouter } from "next/router";
import { ScrollArea } from "../../../../ui/scroll-area";
import clsx from "clsx";
import ScoresEvaluatorsConfig from "./scores/ScoresEvaluatorsConfig";
import { ExperimentRandomInputSelector } from "../experimentRandomInputSelector";

interface ExperimentTableProps {
  promptSubversionId?: string;
  experimentId?: string;
}

export function ExperimentTable({
  promptSubversionId,
  experimentId,
}: ExperimentTableProps) {
  const org = useOrg();
  const orgId = org?.currentOrg?.id;
  const jawn = useJawnClient();
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [wrapText, setWrapText] = useState(false);
  const [columnView, setColumnView] = useState<"all" | "inputs" | "outputs">(
    "all"
  );
  const [showScoresTable, setShowScoresTable] = useLocalStorage(
    "showScoresTable",
    false
  );

  const [isHypothesisRunning, setIsHypothesisRunning] = useState(false);

  // State to control ExperimentInputSelector
  const [showExperimentInputSelector, setShowExperimentInputSelector] =
    useState(false);

  const experimentTableRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<GridApi | null>(null);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridRef.current = params.api;
  }, []);

  const fetchExperiments = useCallback(async () => {
    if (!orgId) return null;
    const jawnClient = getJawnClient(orgId);
    const res = await jawnClient.POST("/v1/experiment/query", {
      body: {
        filter: experimentId
          ? {
              experiment: {
                id: {
                  equals: experimentId,
                },
              },
            }
          : {},
        include: {
          responseBodies: true,
          promptVersion: true,
          score: true,
        },
      },
    });

    return res.data?.data?.[0];
  }, [orgId, experimentId]);

  const { data: experimentData, refetch: refetchExperiments } = useQuery(
    ["experiments", orgId, experimentId],
    fetchExperiments,
    {
      enabled: !!orgId && !!experimentId,
      refetchInterval: 10000,
    }
  );

  const fetchExperimentTable = useCallback(async () => {
    if (!orgId || !experimentId) return null;

    const jawnClient = getJawnClient(orgId);
    const res = await jawnClient.POST("/v1/experiment/table/{experimentId}", {
      params: {
        path: {
          experimentId: experimentId,
        },
      },
    });

    // if (res.error) {
    //   console.error("Error fetching experiment table:", res.error);
    //   return null;
    // }

    return res.data?.data; // Assuming the data is in res.data.data
  }, [orgId, experimentId]);

  const { data: experimentTableData, refetch: refetchExperimentTable } =
    useQuery(["experimentTable", orgId, experimentId], fetchExperimentTable, {
      enabled: !!orgId && !!experimentId,
    });

  const handleAddColumn = useCallback(
    async (columnName: string, columnType: string, hypothesisId?: string) => {
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
          },
        }
      );

      if (res.error) {
        console.error("Error adding column:", res);
      } else {
        // Refetch the experiment table or update state
        await refetchExperimentTable();
      }
    },
    [experimentId, jawn, refetchExperimentTable]
  );

  const providerKey = useMemo(
    () => (experimentData?.meta as any)?.provider_key,
    [experimentData]
  );

  const fetchInputRecords = useCallback(async () => {
    const datasetId = experimentData?.dataset.id;
    if (!orgId || !datasetId || !promptSubversionId) return [];
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
  }, [orgId, experimentData?.dataset?.id, promptSubversionId]);

  // Define fetchPromptVersionTemplate
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

  // Use useQuery to fetch promptVersionTemplateData
  const { data: promptVersionTemplateData } = useQuery(
    ["promptVersionTemplate", promptSubversionId],
    fetchPromptVersionTemplate,
    {
      staleTime: Infinity, // Data will never be considered stale
      cacheTime: Infinity, // Keep the data in cache indefinitely
      enabled: !!orgId && !!promptSubversionId, // Enable query only if values are available
    }
  );

  // Memoize promptVersionTemplate
  const promptVersionTemplate = promptVersionTemplateData;

  // Store promptVersionTemplate in a ref
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
    ["inputRecords", orgId, experimentData?.dataset?.id],
    fetchInputRecords,
    {
      enabled: !!experimentData?.dataset?.id && !!promptSubversionId,
    }
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
  const [tempRowId, setTempRowId] = useState(0);

  // After defining inputKeys
  const inputColumnFields = Array.from(inputKeys);

  const getRequestDataByIds = useCallback(
    async (requestIds: string[]) => {
      const jawnClient = getJawnClient(orgId);
      const res = await jawnClient.POST("/v1/request/query-ids", {
        body: { requestIds },
      });
      return res.data?.data;
    },
    [orgId]
  );

  const { data: requestData } = useQuery(
    ["requestData", orgId],
    getRequestDataByIds,
    {
      enabled: !!orgId,
    }
  );

  // Modify updateRowData to be async
  const updateRowData = useCallback(async () => {
    setIsDataLoading(true);

    if (!experimentTableData) {
      setRowData([]);
      setIsDataLoading(false);
      return;
    }

    // Build a mapping of rowIndex to row object
    const rowIndexToRow = new Map<number, any>();

    // Collect requestIds for experiment columns
    const requestIdsToFetch = new Set<string>();

    // For each column
    experimentTableData.columns.forEach((column) => {
      const columnId = column.id;

      if (column.columnType === "experiment") {
        // Process experiment columns
        column.cells.forEach((cell) => {
          const rowIndex = cell.rowIndex;
          let row = rowIndexToRow.get(rowIndex);
          if (!row) {
            row = { id: `row-${rowIndex}`, rowIndex };
            rowIndexToRow.set(rowIndex, row);
          }

          // Collect requestIds
          if (cell.requestId) {
            // Temporarily store requestId in the cell data
            row[columnId] = { requestId: cell.requestId };
            requestIdsToFetch.add(cell.requestId);
          }
        });
      } else {
        // Non-experiment columns
        column.cells.forEach((cell) => {
          const rowIndex = cell.rowIndex;
          let row = rowIndexToRow.get(rowIndex);
          if (!row) {
            row = { id: `row-${rowIndex}`, rowIndex };
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
    let requestDataMap = new Map<string, any>();
    if (requestIdsToFetch.size > 0) {
      const requestIdsArray = Array.from(requestIdsToFetch);
      console.log("requestIdsArray", requestIdsArray);
      const requestDataArray = await getRequestDataByIds(requestIdsArray);
      // Build a map from requestId to requestData
      requestDataArray?.forEach((requestDataItem) => {
        requestDataMap.set(requestDataItem.request_id, requestDataItem);
      });
    }

    // Now construct the rowData array
    const newRowData = Array.from(rowIndexToRow.values()).map((row) => {
      // Process experiment column data
      Object.entries(row).forEach(([columnId, cellData]) => {
        if (
          experimentTableData.columns.some(
            (col) => col.id === columnId && col.columnType === "experiment"
          ) &&
          cellData?.requestId
        ) {
          const requestData = requestDataMap.get(cellData.requestId);
          if (requestData) {
            // Set the value in the row based on requestData
            row[columnId] = requestData.response_body; // Adjust according to your data structure
          } else {
            row[columnId] = null; // Or any default value
          }
        }
      });

      // Find existing row to preserve isLoading state
      const existingRow = rowData.find(
        (existingRow) => existingRow.id === row.id
      );

      return {
        ...row,
        isLoading: existingRow?.isLoading || {},
      };
    });

    // Sort rows by rowIndex
    newRowData.sort((a, b) => a.rowIndex - b.rowIndex);

    setRowData(newRowData);
    setIsDataLoading(false);
  }, [experimentTableData, rowData, getRequestDataByIds]);

  // Modify the useEffect that updates rowData
  useEffect(() => {
    if (experimentTableData) {
      updateRowData();
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
      setIsDataLoading(false); // Ensure we're not in a loading state
    }
  }, [experimentTableData, experimentId]);

  // Add a new useEffect to handle initial loading state
  useEffect(() => {
    if (!experimentId) {
      setIsDataLoading(false);
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
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
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
      }>;
    }) => {
      await jawn.POST("/v1/experiment/run", {
        body: {
          experimentId: experimentId ?? "",
          hypothesisId,
          cells,
        },
      });
    },
    {
      onMutate: ({ hypothesisId, cells }) => {
        // Update loading state in rowData
        setRowData((prevData) =>
          prevData.map((row) => {
            if (
              cells.some((cell) => cell.datasetRowId === row.dataset_row_id)
            ) {
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
      onSettled: async (_, __, { hypothesisId, cells }) => {
        await refetchExperiments();
        await refetchInputRecords();

        // Reset loading state
        setRowData((prevData) =>
          prevData.map((row) => {
            if (
              cells.some((cell) => cell.datasetRowId === row.dataset_row_id)
            ) {
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

        const anyLoading = rowData.some((row) =>
          Object.values(row.isLoading || {}).some((loading) => loading)
        );

        if (!anyLoading) {
          setIsHypothesisRunning(false);
        }
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
      }>
    ) => {
      runHypothesisMutation.mutate({ hypothesisId, cells });
    },
    [runHypothesisMutation]
  );

  const refetchData = async () => {
    await refetchExperiments();
    await refetchInputRecords();
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isHypothesisRunning) {
      intervalId = setInterval(() => {
        // Refetch data and refresh the grid
        refetchExperiments();
        // refetchInputRecords();
        gridRef.current?.refreshCells();
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isHypothesisRunning, refetchExperiments, refetchInputRecords]);

  // Determine the hypotheses to run (excluding the first one)
  const hypothesesToRun = useMemo(() => {
    return experimentData?.hypotheses.map((h: any) => h.id) || [];
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

        // If this is the last input column, add a new row
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

  // First, create a helper function to get input columns
  const getInputColumns = useCallback(() => {
    return (
      experimentTableData?.columns?.filter(
        (column) => column.columnType === "input"
      ) || []
    );
  }, [experimentTableData?.columns]);

  // Modify handleLastInputSubmit to use input columns
  const handleLastInputSubmit = useCallback(
    async (rowIndex: number) => {
      console.log("currentRowInputs", currentRowInputs);

      // Check if all current row values are filled
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
            },
            params: {
              path: {
                promptVersionId: promptSubversionId ?? "",
                datasetId: experimentData?.dataset?.id ?? "",
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
      } catch (error) {
        console.error("Error submitting row:", error);
      }
    },
    [
      currentRowInputs,
      jawn,
      promptSubversionId,
      experimentData?.dataset?.id,
      inputKeys,
      refetchInputRecords,
      getInputColumns,
    ]
  );

  const extractVariables = useCallback((promptTemplate: PromptObject) => {
    const regex =
      /(?:\{\{([^}]+)\}\})|(?:<helicone-prompt-input key="([^"]+)"[^>]*\/>)/g;
    const variablesSet = new Set<string>();

    promptTemplate?.messages?.forEach((message) => {
      const content = Array.isArray(message.content)
        ? message.content.map((c) => c.text).join("\n")
        : message.content;

      let match;
      while ((match = regex.exec(content))) {
        const key = match[1] || match[2];
        if (key) {
          variablesSet.add(key.trim());
        }
      }
    });

    return Array.from(variablesSet);
  }, []);

  useEffect(() => {
    if (promptVersionTemplate) {
      console.log("promptVersionTemplate", promptVersionTemplate);
      const extractedVariables = extractVariables(
        promptVersionTemplate.helicone_template as any
      );
      console.log("extractedVariables", extractedVariables);
      console.log("helicone_template", promptVersionTemplate.helicone_template);
      if (extractedVariables.length > 0) {
        //setInputKeys(new Set(extractedVariables));
      } else {
        //setInputKeys(new Set(["Input 1"]));
      }
    }
  }, [promptVersionTemplate, extractVariables]);

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

    const inputColumns: Set<string> = new Set();

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
          field: "original",
          headerName: "Original",
          width: 200,
          headerComponent: CustomHeaderComponent,
          headerComponentParams: {
            displayName: "Original",
            badgeText: "Output",
            badgeVariant: "secondary",
            hypothesis: sortedHypotheses[1] || {},
            promptVersionTemplate: promptVersionTemplate,
          },
          cellClass: "border-r border-[#E2E8F0] text-slate-700 pt-2.5",
          headerClass: headerClass,
          cellRenderer: OriginalOutputCellRenderer,
          cellRendererParams: {
            prompt: promptVersionTemplate,
            handleRunHypothesis,
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
      } else if (column.columnType === "experiment") {
        console.log("column", column);
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
              loadingStates,
              wrapText,
            },
            headerComponent: CustomHeaderComponent,
            headerComponentParams: {
              displayName: column.columnName,
              badgeText: "Output",
              badgeVariant: "secondary",
              hypothesisId: column.hypothesisId,
              onRunColumn: async (colId: string) => {
                console.log("rowData", rowData);
                const cells = rowData.map((row, index) => ({
                  rowIndex: index,
                  datasetRowId: row.dataset_row_id,
                  columnId: colId,
                }));
                await handleRunHypothesis(column.hypothesisId ?? "", cells);
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

    console.log("inputColumns", inputColumns);

    // Add columns for each input key
    // Array.from(inputKeys).forEach((key, index) => {
    //   columns.push({
    //     field: key,
    //     headerName: key,
    //     width: 150,
    //     cellRenderer: InputCellRenderer,
    //     cellRendererParams: {
    //       index: index,
    //       wrapText,
    //     },
    //     cellClass: "border-r border-[#E2E8F0] text-slate-700 pt-2.5",
    //     headerClass: "border-r border-[#E2E8F0]",
    //     headerComponent: InputsHeaderComponent,
    //     headerComponentParams: {
    //       index: index,
    //       displayName: key,
    //       badgeText: "Input",
    //     },
    //     cellStyle: {
    //       justifyContent: "start",
    //       whiteSpace: wrapText ? "normal" : "nowrap",
    //     },
    //     autoHeight: wrapText,
    //     editable: false, // Set this to false to prevent default editing
    //   });
    // });

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
          hypothesis: sortedHypotheses[0] || {},
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

    // Add the "Original" column
    // columns.push({
    //   field: "original",
    //   headerName: "Original",
    //   width: 200,
    //   headerComponent: CustomHeaderComponent,
    //   headerComponentParams: {
    //     displayName: "Original",
    //     badgeText: "Output",
    //     badgeVariant: "secondary",
    //     hypothesis: sortedHypotheses[1] || {},
    //     promptVersionTemplate: promptVersionTemplate,
    //   },
    //   cellClass: "border-r border-[#E2E8F0] text-slate-700 pt-2.5",
    //   headerClass: headerClass,
    //   cellRenderer: OriginalOutputCellRenderer,
    //   cellRendererParams: {
    //     prompt: promptVersionTemplate,
    //     handleRunHypothesis,
    //     wrapText,
    //   },
    //   cellStyle: {
    //     verticalAlign: "middle",
    //     textAlign: "left",
    //     overflow: "hidden",
    //     textOverflow: "ellipsis",
    //     whiteSpace: wrapText ? "normal" : "nowrap",
    //   },
    //   autoHeight: wrapText,
    // });

    // Add columns for additional experiments
    // if (columnView === "all" || columnView === "outputs") {
    //   sortedHypotheses.forEach((hypothesis, index) => {
    //     const experimentNumber = index + 1;
    //     columns.push({
    //       field: hypothesis.id,
    //       headerName: hypothesis.id,
    //       width: 230,
    //       suppressSizeToFit: true,
    //       cellRenderer: HypothesisCellRenderer,
    //       cellRendererParams: {
    //         hypothesisId: hypothesis.id,
    //         handleRunHypothesis,
    //         loadingStates,
    //         wrapText,
    //       },
    //       headerComponent: CustomHeaderComponent,
    //       headerComponentParams: {
    //         displayName: `Experiment ${experimentNumber}`,
    //         badgeText: "Output",
    //         badgeVariant: "secondary",
    //         onRunColumn: async (colId: string) => {
    //           const datasetRowIds = rowData.map((row) => row.dataset_row_id);
    //           await Promise.all(
    //             datasetRowIds.map((datasetRowId) =>
    //               handleRunHypothesis(colId, [datasetRowId])
    //             )
    //           );
    //         },
    //         hypothesis: hypothesis,
    //       },
    //       cellClass: "border-r border-[#E2E8F0] text-slate-700 pt-2.5",
    //       headerClass: "border-r border-[#E2E8F0]",
    //       cellStyle: {
    //         verticalAlign: "middle",
    //         textAlign: "left",
    //         overflow: "hidden",
    //         textOverflow: "ellipsis",
    //         whiteSpace: wrapText ? "normal" : "nowrap",
    //       },
    //       autoHeight: wrapText,
    //     });
    //   });
    // }

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
      headerClass: "border-r border-[#E2E8F0]",
      headerComponentParams: {
        promptVersionId: promptSubversionId,
        promptVersionTemplate: promptVersionTemplate,
        experimentId,
        selectedProviderKey: providerKey,
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
    sortedHypotheses,
    columnView,
    handleRunHypothesis,
    loadingStates,
    rowData,
    wrapText,
    inputKeys,
    columnWidths,
    columnOrder,
    activePopoverCell,
    handleLastInputSubmit,
  ]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedProviderKey, setSelectedProviderKey] = useState(providerKey);
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

      sortedHypotheses.forEach((hypothesis, index) => {
        const experimentLabel = `Experiment ${index + 1}`;
        exportedRow[experimentLabel] = row[hypothesis.id] || "";
      });

      return exportedRow;
    });

    return exportedData;
  }, [rowData, inputColumnFields, sortedHypotheses]);

  // Add this new component
  const NewExperimentPopover = () => {
    const notification = useNotification();
    const [basePrompt, setBasePrompt] = useState<PromptObject>({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: [{ text: "You are a helpful assistant.", type: "text" }],
        },
      ],
    });

    const router = useRouter();

    const [selectedInput, setSelectedInput] = useState<PromptInput>({
      id: "",
      inputs: {},
      source_request: "",
      prompt_version: "",
      created_at: "",
      auto_prompt_inputs: [],
      response_body: "",
    });

    const [promptName, setPromptName] = useState<string>("");
    const [promptVariables, setPromptVariables] = useState<
      Array<{ original: string; heliconeTag: string; value: string }>
    >([]);

    const [inputs, setInputs] = useState<{ variable: string; value: string }[]>(
      [{ variable: "sectionTitle", value: "The universe" }]
    );

    const handleInputChange = (
      index: number,
      field: "variable" | "value",
      newValue: string
    ) => {
      const newInputs = [...inputs];
      newInputs[index][field] = newValue;
      setInputs(newInputs);
    };

    const addNewInput = () => {
      setInputs([...inputs, { variable: "", value: "" }]);
    };

    const handlePromptChange = (newPrompt: string | PromptObject) => {
      setBasePrompt(newPrompt as PromptObject);
    };

    const handleCreateExperiment = async () => {
      if (!promptName || !basePrompt) {
        notification.setNotification(
          "Please enter a prompt name and content",
          "error"
        );
        return;
      }

      if (!basePrompt.model) {
        notification.setNotification("Please select a model", "error");
        return;
      }

      const res = await jawn.POST("/v1/prompt/create", {
        body: {
          userDefinedId: promptName,
          prompt: basePrompt,
          metadata: {
            createdFromUi: true,
          },
        },
      });
      if (res.error || !res.data) {
        notification.setNotification("Failed to create prompt", "error");
        return;
      }

      if (!res.data?.data?.id || !res.data?.data?.prompt_version_id) {
        notification.setNotification("Failed to create prompt", "error");
        return;
      }

      const dataset = await jawn.POST("/v1/helicone-dataset", {
        body: {
          datasetName: "Dataset for Experiment",
          requestIds: [],
        },
      });
      if (!dataset.data?.data?.datasetId) {
        notification.setNotification("Failed to create dataset", "error");
        return;
      }

      // const experiment = await jawn.POST("/v1/experiment/new-empty", {
      //   body: {
      //     metadata: {
      //       prompt_id: res.data?.data?.id!,
      //       prompt_version: res.data?.data?.prompt_version_id!,
      //       experiment_name: `${promptName}_V1.0` || "",
      //     },
      //     datasetId: dataset.data?.data?.datasetId,
      //   },
      // });
      // if (!experiment.data?.data?.experimentId) {
      //   notification.setNotification("Failed to create experiment", "error");
      //   return;
      // }
      // const result = await jawn.POST(
      //   "/v1/prompt/version/{promptVersionId}/subversion",
      //   {
      //     params: {
      //       path: {
      //         promptVersionId: res.data?.data?.prompt_version_id!,
      //       },
      //     },
      //     body: {
      //       newHeliconeTemplate: JSON.stringify(basePrompt),
      //       isMajorVersion: false,
      //       metadata: {
      //         experimentAssigned: true,
      //       },
      //     },
      //   }
      // );

      const experimentTableResult = await jawn.POST(
        "/v1/experiment/new-experiment-table",
        {
          body: {
            datasetId: dataset.data?.data?.datasetId!,
            promptVersionId: res.data?.data?.prompt_version_id!,
            newHeliconeTemplate: JSON.stringify(basePrompt),
            isMajorVersion: false,
            promptSubversionMetadata: {
              experimentAssigned: true,
            },
            experimentMetadata: {
              prompt_id: res.data?.data?.id!,
              prompt_version: res.data?.data?.prompt_version_id!,
              experiment_name: `${promptName}_V1.0` || "",
            },
          },
        }
      );

      //TODO: Add this back in ?

      // if (promptVariables.length > 0) {
      //   const inputs: Record<string, string> = promptVariables.reduce(
      //     (acc: Record<string, string>, variable: any) => {
      //       acc[variable.original] = variable.value as string;
      //       return acc;
      //     },
      //     {}
      //   );
      //   await jawn.POST(
      //     "/v1/experiment/dataset/{datasetId}/version/{promptVersionId}/row/new",
      //     {
      //       body: {
      //         inputs: inputs,
      //       },
      //       params: {
      //         path: {
      //           promptVersionId: res.data?.data?.prompt_version_id!,
      //           datasetId: dataset.data?.data?.datasetId!,
      //         },
      //       },
      //     }
      //   );
      // }

      // if (result.error || !result.data) {
      //   notification.setNotification("Failed to create subversion", "error");
      //   return;
      // }

      // notification.setNotification("Prompt created successfully", "success");
      // setIsDataLoading(true);
      // await router.push(
      //   `/prompts/${res.data?.data?.id}/subversion/${res.data?.data?.prompt_version_id}/experiment/${experiment.data?.data?.experimentId}`
      // );
    };

    return (
      <PopoverContent
        className="w-[600px] p-4 bg-white shadow-lg rounded-md"
        side="bottom"
        align="start"
      >
        <ScrollArea className="flex flex-col overflow-y-auto max-h-[700px] ">
          <div className="space-y-4">
            <div className="flex flex-row space-x-2 ">
              <BeakerIcon className="h-6 w-6" />
              <h3 className="text-md font-semibold">Original Prompt</h3>
            </div>

            <Input
              placeholder="Prompt Name"
              value={promptName}
              onChange={(e) => setPromptName(e.target.value)}
            />

            <PromptPlayground
              prompt={basePrompt}
              editMode={true}
              selectedInput={selectedInput}
              defaultEditMode={true}
              submitText={"Create Experiment"}
              playgroundMode={"experiment"}
              handleCreateExperiment={handleCreateExperiment}
              isPromptCreatedFromUi={true}
              onExtractPromptVariables={(variables) =>
                setPromptVariables(
                  variables.map((variable) => ({
                    original: variable.original,
                    heliconeTag: variable.heliconeTag,
                    value: variable.value,
                  }))
                )
              }
              onPromptChange={handlePromptChange}
            />
          </div>
        </ScrollArea>
      </PopoverContent>
    );
  };

  if (isDataLoading) {
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
            <ScoresTable
              columnDefs={columnDefs}
              columnWidths={columnWidths}
              columnOrder={columnOrder}
              experimentId={experimentId}
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
            colResizeDefault="shift"
            suppressRowTransform={true}
            domLayout="autoHeight"
            getRowId={getRowId}
            context={{
              setShowExperimentInputSelector,
              setShowRandomInputSelector,
              handleRunHypothesis,
              hypothesesToRun,
              inputKeys: Array.from(inputKeys),
              experimentTableData,
              inputColumnFields,
              hypotheses: sortedHypotheses,
              refetchExperiments,
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
          onClick={handleAddRow}
          className="max-w-32 flex flex-row space-x-2 text-md text-[#334155]"
        >
          <PlusIcon className="h-6 w-6" />
          Add row
        </Button>
      </div>

      {/* <SettingsPanel
        defaultProviderKey={providerKey}
        setSelectedProviderKey={async (key) => {
          await jawn.POST("/v1/experiment/update-meta", {
            body: {
              experimentId: experimentId ?? "",
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
      /> */}

      <ExperimentRandomInputSelector
        open={showRandomInputSelector}
        setOpen={setShowRandomInputSelector}
        meta={{
          promptVersionId: promptSubversionId,
          datasetId: experimentData?.dataset?.id,
        }}
        requestIds={randomInputRecords}
        onSuccess={async (success) => {
          if (success) {
            await refetchExperiments();
            await refetchInputRecords();
            setShowRandomInputSelector(false);
          }
        }}
      />

      {/* Include the ExperimentInputSelector */}
      <ExperimentInputSelector
        open={showExperimentInputSelector}
        setOpen={setShowExperimentInputSelector}
        setShowRandomInputSelector={setShowRandomInputSelector}
        meta={{
          promptVersionId: promptSubversionId,
          datasetId: experimentData?.dataset?.id,
        }}
        requestIds={randomInputRecords}
        onSuccess={async (success) => {
          if (success) {
            // Handle success: Re-fetch experiments and input records
            await refetchExperiments();
            await refetchInputRecords();
          }
        }}
      />
    </div>
  );
}
