import React, { useRef, useEffect, useState } from "react";
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
  GridApi,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useMemo } from "react";
import AddColumnHeader from "./AddColumnHeader";
import {
  HypothesisCellRenderer,
  OriginalMessagesCellRenderer,
  OriginalOutputCellRenderer,
} from "./HypothesisCellRenderer";
import { BeakerIcon, PlusIcon } from "@heroicons/react/24/outline";
import ExperimentInputSelector from "../experimentInputSelector";
import { useMutation } from "@tanstack/react-query";

import {
  InputCellRenderer,
  CustomHeaderComponent,
  RowNumberHeaderComponent,
  RowNumberCellRenderer,
  InputsHeaderComponent,
} from "./components/tableElementsRenderer";
import { ColumnsDropdown } from "./components/customButtonts";
import ScoresTable from "./ScoresTable";
import ExportButton from "../../../../shared/themed/table/exportButton";
import LoadingAnimation from "../../../../shared/loadingAnimation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { FileTextIcon } from "lucide-react";
import {
  usePrompts,
  usePromptVersions,
} from "../../../../../services/hooks/prompts/prompts";
import { ScrollArea } from "../../../../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../ui/select";

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
  const { prompts, isLoading, refetch } = usePrompts();

  const [wrapText, setWrapText] = useState(false);
  const [columnView, setColumnView] = useState<"all" | "inputs" | "outputs">(
    "all"
  );
  const [showScoresTable, setShowScoresTable] = useState(false);
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
    }
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

  // Function to update rowData based on fetched data
  const updateRowData = useCallback(
    (experimentData: any, inputRecordsData: any[]) => {
      setIsDataLoading(true);
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

      const newRowData = inputRecordsData.map((row) => {
        const hypothesisRowData: Record<string, string> = {};

        // Always populate "Messages" and "Original" columns
        hypothesisRowData["messages"] = JSON.stringify(
          //@ts-ignore
          row?.request_body?.messages || {},
          null,
          2
        );
        let content = row?.response_body?.choices?.[0]?.message?.content || "";

        // Parse the content if it's a JSON string
        try {
          hypothesisRowData["original"] = JSON.parse(content);
        } catch (error) {
          hypothesisRowData["original"] = content; // Use original content if parsing fails
        }

        // Add data for other hypotheses if they exist
        experimentData.hypotheses.forEach((hypothesis: any) => {
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

        // Find existing row to preserve isLoading state
        const existingRow = rowData.find(
          (existingRow) => existingRow.dataset_row_id === row.dataset_row_id
        );

        return {
          id: row.dataset_row_id,
          dataset_row_id: row.dataset_row_id,
          // Spread inputs to individual fields
          ...row.inputs,
          ...hypothesisRowData,
          isLoading: existingRow?.isLoading || {}, // Preserve isLoading state
        };
      });

      setRowData(newRowData);
      setIsDataLoading(false);
    },
    [experimentData, inputRecordsData]
  );

  // Modify the useEffect that updates rowData
  useEffect(() => {
    if (experimentData && inputRecordsData) {
      updateRowData(experimentData, inputRecordsData);
    } else if (!experimentId) {
      // If there's no experimentId, set a default empty row
      const defaultInputKey = "Input 1";
      setInputKeys(new Set([defaultInputKey]));
      setRowData([
        {
          id: `temp-${Date.now()}`,
          dataset_row_id: null,
          [defaultInputKey]: "",
          isLoading: {},
        },
      ]);
      setIsDataLoading(false); // Ensure we're not in a loading state
    }
  }, [experimentData, inputRecordsData, experimentId]);

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
      datasetRowIds,
    }: {
      hypothesisId: string;
      datasetRowIds: string[];
    }) => {
      await jawn.POST("/v1/experiment/run", {
        body: {
          experimentId: experimentId ?? "",
          hypothesisId,
          datasetRowIds,
        },
      });
    },
    {
      onMutate: ({ hypothesisId, datasetRowIds }) => {
        // Update loading state in rowData
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
        const anyLoading = rowData.some((row) =>
          Object.values(row.isLoading || {}).some((loading) => loading)
        );

        if (!anyLoading) {
          // No hypotheses are running
          setIsHypothesisRunning(false);
        }
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
    Record<string, string>
  >({});

  const handleInputChange = useCallback((key: string, value: string) => {
    setCurrentRowInputs((prev) => ({ ...prev, [key]: value.trim() }));
  }, []);

  const handleLastInputSubmit = useCallback(async () => {
    // Check if all inputs are filled
    const allInputsFilled = Array.from(inputKeys).every(
      (key) => currentRowInputs[key] && currentRowInputs[key].trim() !== ""
    );

    if (!allInputsFilled) {
      console.log(
        "Not all inputs are filled. Please fill all inputs before submitting."
      );
      return;
    }

    try {
      await jawn.POST(
        "/v1/experiment/dataset/{datasetId}/version/{promptVersionId}/row/new",
        {
          body: {
            inputs: currentRowInputs,
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
  }, [
    currentRowInputs,
    jawn,
    promptSubversionId,
    experimentData?.dataset?.id,
    inputKeys,
    refetchInputRecords,
    setActivePopoverCell,
  ]);

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
        headerComponent: InputsHeaderComponent,
        headerComponentParams: {
          index: index,
          displayName: key,
          badgeText: "Input",
        },
        cellStyle: {
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          justifyContent: "start",
          whiteSpace: wrapText ? "normal" : "nowrap",
        },
        autoHeight: wrapText,
        editable: false, // Set this to false to prevent default editing
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
        promptVersionTemplate: promptVersionTemplate,
      },
      cellClass:
        "border-r border-[#E2E8F0] text-slate-700 flex items-center justify-start pt-2.5",
      headerClass: "border-r border-[#E2E8F0]",
      cellRenderer: OriginalMessagesCellRenderer,
      cellRendererParams: {
        prompt: promptVersionTemplate,
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
        promptVersionTemplate: promptVersionTemplate,
      },
      cellClass: "border-r border-[#E2E8F0] text-slate-700 pt-2.5",
      headerClass: "border-r border-[#E2E8F0]",
      cellRenderer: OriginalOutputCellRenderer,
      cellRendererParams: {
        prompt: promptVersionTemplate,
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

    // Add columns for additional experiments
    if (columnView === "all" || columnView === "outputs") {
      sortedHypotheses.forEach((hypothesis, index) => {
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
            onRunColumn: async (colId: string) => {
              const datasetRowIds = rowData.map((row) => row.dataset_row_id);
              await Promise.all(
                datasetRowIds.map((datasetRowId) =>
                  handleRunHypothesis(colId, [datasetRowId])
                )
              );
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
        promptVersionTemplate: promptVersionTemplate,
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
    activePopoverCell,
    handleLastInputSubmit,
  ]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedProviderKey, setSelectedProviderKey] = useState(providerKey);

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
    const [selectedPromptId, setSelectedPromptId] = useState<string | null>(
      null
    );

    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
      null
    );

    const { prompts: promptVersions, isLoading: isLoadingVersions } =
      usePromptVersions(selectedPromptId ?? "");

    const handlePromptSelect = (promptId: string) => {
      setSelectedPromptId(promptId);
    };

    return (
      <PopoverContent className="w-[400px] p-4 bg-white shadow-lg rounded-md">
        <div className="space-y-4">
          <div className="flex flex-row space-x-2 ">
            <BeakerIcon className="h-6 w-6" />
            <h3 className="text-md font-semibold">Welcome to Experiments</h3>
          </div>

          <div className="bg-[#F9FAFB] border border-[#E2E8F0] p-4 rounded-md">
            <h3 className="font-semibold mb-2">Start with a template</h3>
            <p className="text-sm text-gray-500 mb-2">
              Includes a prompt, some sample inputs, and an improved prompt
              (aka. an experiment).
            </p>
            <div className="space-y-2">
              {[
                "Text classification",
                "Knowledge retrieval",
                "Step-by-step instructions",
              ].map((template) => (
                <Button
                  key={template}
                  variant="outline"
                  className="w-full justify-start bg-slate-100 border border-[#E2E8F0] text-center flex flex-col"
                >
                  {template}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Start with a prompt</h3>
            <p className="text-sm text-gray-500 mb-2">
              Choose an existing prompt and select the version you want to
              experiment on.
            </p>
            <ScrollArea className="flex flex-col overflow-y-auto max-h-[30vh] ">
              {prompts &&
                prompts?.map((prompt) => (
                  <Button
                    key={prompt.id}
                    variant="ghost"
                    className="w-full justify-start mt-2"
                    onClick={() => handlePromptSelect(prompt.id)}
                  >
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    {prompt.user_defined_id}
                  </Button>
                ))}
            </ScrollArea>
            {selectedPromptId &&
              promptVersions &&
              promptVersions.length > 0 && (
                <div className="mt-4 flex flex-row space-x-2 items-center justify-center">
                  <h4 className="font-semibold ">Version</h4>
                  <Select
                    value={selectedVersionId ?? ""}
                    onValueChange={setSelectedVersionId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingVersions
                            ? "Loading versions..."
                            : "Select the version"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {!isLoadingVersions &&
                        promptVersions.map((version: any) => (
                          <SelectItem key={version.id} value={version.id}>
                            {version.name ||
                              `V ${version.major_version}.${version.minor_version}`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

            <div className="mt-4 flex flex-col space-y-2 items-center justify-center">
              <Button
                variant="default"
                disabled={!selectedVersionId}
                onClick={() => alert(1)}
                className="w-full"
              >
                Create experiment
              </Button>
              <Button
                variant="outline"
                onClick={() => alert(1)}
                className="w-full"
              >
                Start from scratch
              </Button>
            </div>
          </div>
        </div>
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
          <ExportButton
            className="py-0 px-2 border border-slate-200 h-8 flex items-center justify-center space-x-1 bg-white"
            key="export-button"
            rows={getExperimentExportData()}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="py-0 px-2 border border-slate-200 h-8 flex items-center justify-center space-x-1 flex gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                New Experiment
              </Button>
            </PopoverTrigger>
            <NewExperimentPopover />
          </Popover>
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
              handleRunHypothesis,
              hypothesesToRun,
              inputKeys: Array.from(inputKeys),
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

      {/* Include the ExperimentInputSelector */}
      <ExperimentInputSelector
        open={showExperimentInputSelector}
        setOpen={setShowExperimentInputSelector}
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
