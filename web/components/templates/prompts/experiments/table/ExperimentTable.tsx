import { useOrg } from "@/components/layout/organizationContext";
import ThemedDrawer from "@/components/shared/themed/themedDrawer";
import { Button } from "@/components/ui/button";
import { getJawnClient } from "@/lib/clients/jawn";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useQuery } from "@tanstack/react-query";
import { ColDef, GridReadyEvent } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useMemo, useRef, useState } from "react";
import ProviderKeyList from "../../../enterprise/portal/id/providerKeyList";
import AddColumnHeader from "./AddColumnHeader";
import { HypothesisCellRenderer } from "./HypothesisCellRenderer";
import { HypothesisHeaderComponent } from "./HypothesisHeaderComponent";
import { PlusIcon, TableCellsIcon } from "@heroicons/react/24/outline";
import ExperimentInputSelector from "../experimentInputSelector";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../ui/popover";

interface ExperimentTableProps {
  promptSubversionId: string;
  experimentId: string;
}

interface SettingsPanelProps {
  setSelectedProviderKey: (key: string | null) => void;
  wrapText: boolean;
  setWrapText: (wrap: boolean) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  defaultProviderKey: string | null;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  defaultProviderKey,
  setSelectedProviderKey,
  wrapText,
  setWrapText,
  open,
  setOpen,
}) => {
  return (
    <ThemedDrawer
      open={open}
      setOpen={setOpen}
      defaultWidth="md:min-w-[300px] w-full md:w-[400px]"
    >
      <div className="py-4 space-y-4">
        <h2 className="text-lg font-semibold mb-4">Settings</h2>
        <ProviderKeyList
          variant="basic"
          setProviderKeyCallback={setSelectedProviderKey}
          defaultProviderKey={defaultProviderKey}
        />
        <Button className="w-full" onClick={() => setWrapText(!wrapText)}>
          {wrapText ? "Disable" : "Enable"} Word Wrap
        </Button>
      </div>
    </ThemedDrawer>
  );
};

// Custom cell renderer with Popover
const InputCellRenderer: React.FC<any> = (props) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <div
          className="cursor-pointer"
          style={{
            whiteSpace: "inherit",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {props.value}
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        <h2 className="text-sm w-full font-semibold px-2 pt-2">
          Enter manually, or:
        </h2>
        <div className="flex flex-col space-y-2 p-2">
          <Button
            onClick={() => {
              setPopoverOpen(false);
              props.context.setShowExperimentInputSelector(true);
            }}
            className="w-full h-8"
            variant="ghost"
          >
            <TableCellsIcon className="inline h-4 w-4 mr-2" />
            Select an input set
          </Button>
          {/* <Button
            onClick={() => {
              // Implement select dataset logic
              setPopoverOpen(false);
            }}
            className="w-full"
          >
            Select a dataset
          </Button>
          <Button onClick={() => setPopoverOpen(false)} className="w-full">
            Cancel
          </Button> */}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export function ExperimentTable({
  promptSubversionId,
  experimentId,
}: ExperimentTableProps) {
  const org = useOrg();
  const orgId = org?.currentOrg?.id;
  const jawn = useJawnClient();

  const [wrapText, setWrapText] = useState(false);

  // State to control ExperimentInputSelector
  const [showExperimentInputSelector, setShowExperimentInputSelector] =
    useState(false);

  // Reference for the grid API
  const gridRef = useRef<any>(null);

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
        },
      },
    });
    return res.data?.data?.[0];
  }, [orgId, experimentId]);

  const { data: experimentData, refetch: refetchExperiments } = useQuery(
    ["experiments", orgId, experimentId],
    fetchExperiments,
    {
      onSuccess: (data) => {
        if (data && inputRecordsData) {
          updateRowData(data, inputRecordsData);
        }
      },
    }
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
      onSuccess: (data) => {
        if (experimentData && data) {
          updateRowData(experimentData, data);
        }
      },
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
      })) ?? []
    );
  }, [randomInputRecordsData]);

  // Use useState to manage rowData
  const [rowData, setRowData] = useState<any[]>([]);
  // Keep track of all input keys
  const [inputKeys, setInputKeys] = useState<Set<string>>(new Set());

  // Function to update rowData based on fetched data
  const updateRowData = useCallback(
    (experimentData: any, inputRecordsData: any[]) => {
      const newInputKeys = new Set<string>();
      const newRowData = inputRecordsData.map((row) => {
        const hypothesisRowData: Record<string, string> = {};

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

        // Collect all input keys
        Object.keys(row.inputs).forEach((key) => newInputKeys.add(key));

        return {
          id: row.id,
          dataset_row_id: row.dataset_row_id,
          // Spread inputs to individual fields
          ...row.inputs,
          ...hypothesisRowData,
        };
      });

      setInputKeys(newInputKeys); // Update the set of input keys
      setRowData(newRowData);
    },
    []
  );

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
      },
    }),
    [wrapText]
  );

  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
    gridRef.current = params.api;
  }, []);

  const getRowId = useCallback((params: any) => params.data.id, []);

  const handleRunHypothesis = useCallback(
    async (hypothesisId: string, datasetRowIds: string[]) => {
      await jawn.POST("/v1/experiment/run", {
        body: {
          experimentId,
          hypothesisId,
          datasetRowIds,
        },
      });
    },
    [jawn, experimentId]
  );

  const handleAddRow = useCallback(() => {
    const newRowId = `temp-${Date.now()}`;

    // Initialize input fields with empty strings
    const inputFields = Array.from(inputKeys).reduce((acc, key) => {
      acc[key] = "";
      return acc;
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

  const columnDefs = useMemo<ColDef[]>(() => {
    const columns: ColDef[] = [
      {
        headerName: "#",
        field: "rowNumber",
        width: 50,
        valueGetter: (params) =>
          params.node?.rowIndex !== undefined
            ? (params.node?.rowIndex || 0) + 1
            : "N/A",
        pinned: "left",
        cellClass: "border-r border-gray-200",
        headerClass: "border-r border-gray-200",
      },
    ];

    // Add columns for each input key
    Array.from(inputKeys).forEach((key) => {
      columns.push({
        field: key,
        headerName: key,
        width: 150,
        cellRenderer: InputCellRenderer, // Directly assign the component
        cellClass: "border-r border-gray-200",
        headerClass: "border-r border-gray-200",
      });
    });

    experimentData?.hypotheses?.forEach((hypothesis) => {
      columns.push({
        field: hypothesis.id,
        headerName: hypothesis.id,
        width: 200,
        suppressSizeToFit: true,
        cellRenderer: HypothesisCellRenderer,
        cellRendererParams: {
          hypothesisId: hypothesis.id,
          handleRunHypothesis,
        },
        headerComponent: HypothesisHeaderComponent,
        headerComponentParams: {
          hypothesisId: hypothesis.id,
          handleRunHypothesis,
          inputRecordsData,
        },
        cellClass: "border-r border-gray-200",
        headerClass: "border-r border-gray-200",
      });
    });

    columns.push({
      headerName: "",
      width: 50,
      suppressSizeToFit: true,
      suppressMenu: true,
      sortable: false,
      filter: false,
      resizable: false,
      headerComponent: () => (
        <AddColumnHeader
          promptVersionId={promptSubversionId}
          experimentId={experimentId}
          selectedProviderKey={providerKey}
        />
      ),
    });

    return columns;
  }, [
    experimentData?.hypotheses,
    handleRunHypothesis,
    inputRecordsData,
    promptSubversionId,
    experimentId,
    providerKey,
    inputKeys,
    randomInputRecords,
  ]);

  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="relative w-full h-full">
      <div className="flex flex-col space-y-2 w-full">
        <div className="flex flex-row space-x-2 justify-end w-full">
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            Settings
          </Button>
        </div>
        <div
          className="ag-theme-alpine h-[80vh] w-full border border-gray-200 rounded-md overflow-hidden"
          style={
            {
              "--ag-header-height": "40px",
              "--ag-header-foreground-color": "#000",
              "--ag-header-background-color": "#f3f4f6",
              "--ag-header-cell-hover-background-color": "#e5e7eb",
              "--ag-header-cell-moving-background-color": "#d1d5db",
              "--ag-row-border-color": "#e5e7eb",
              "--ag-row-hover-color": "#f9fafb",
              "--ag-cell-horizontal-border": "none",
              "--ag-borders": "none",
              "--ag-border-color": "#e5e7eb",
            } as React.CSSProperties
          }
        >
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={{
              ...defaultColDef,
              cellClass: "border-r border-gray-200",
              headerClass:
                "border-r border-gray-200 bg-gray-100 text-gray-700 font-semibold",
            }}
            onGridReady={onGridReady}
            enableCellTextSelection={true}
            suppressRowTransform={true}
            getRowId={getRowId}
            context={{
              setShowExperimentInputSelector,
            }}
            rowClass="border-b border-gray-200 hover:bg-gray-50"
            headerHeight={40}
          />
        </div>
        <Button
          variant="ghost"
          onClick={handleAddRow}
          className="max-w-32 flex flex-row space-x-2 text-md"
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
        wrapText={wrapText}
        setWrapText={setWrapText}
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
