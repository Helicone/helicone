import { useOrg } from "@/components/layout/organizationContext";
import { Button } from "@/components/ui/button";
import { getJawnClient } from "@/lib/clients/jawn";
import { useQuery } from "@tanstack/react-query";
import { ColDef, GridReadyEvent } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useMemo, useState } from "react";
import ProviderKeyList from "../../../enterprise/portal/id/providerKeyList";
import AddColumnHeader from "./AddColumnHeader";
import { HypothesisCellRenderer } from "./HypothesisCellRenderer";
import { HypothesisHeaderComponent } from "./HypothesisHeaderComponent";
import { useJawnClient } from "@/lib/clients/jawnHook";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Row } from "@/components/layout/common";
import { ChevronDown } from "lucide-react"; // Import the ChevronDown icon
import { cn } from "@/lib/utils"; // Import the cn function
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ThemedDrawer from "@/components/shared/themed/themedDrawer";

interface ExperimentTableProps {
  promptSubversionId: string;
  experimentId: string;
}

// Add this new component
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

export function ExperimentTable({
  promptSubversionId,
  experimentId,
}: ExperimentTableProps) {
  const org = useOrg();
  const orgId = org?.currentOrg?.id;
  const jawn = useJawnClient();

  const [wrapText, setWrapText] = useState(false);

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
  }, [orgId, experimentData?.dataset.id]);

  const { data: inputRecordsData } = useQuery(
    ["inputRecords", orgId, experimentData?.dataset.id],
    fetchInputRecords,
    {
      enabled: !!experimentData?.dataset.id,
    }
  );

  const rowData = useMemo(() => {
    return inputRecordsData?.map((row) => {
      const hypothesisRowData: Record<string, string> = {};

      experimentData?.hypotheses.forEach((hypothesis) => {
        const hypothesisRun = hypothesis.runs?.find(
          (r) => r.datasetRowId === row.dataset_row_id
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
        inputs: row.inputs,
        ...hypothesisRowData,
      };
    });
  }, [inputRecordsData, experimentData?.hypotheses]);

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

  const handleAddRow = useCallback(async () => {
    if (!orgId || !experimentData?.dataset.id) return;
    const jawnClient = getJawnClient(orgId);
    await jawnClient.POST(
      "/v1/experiment/dataset/{datasetId}/version/{promptVersionId}/row",
      {
        body: {
          inputs: {
            test: "test",
          },
        },
        params: {
          path: {
            promptVersionId: promptSubversionId,
            datasetId: experimentData.dataset.id,
          },
        },
      }
    );
    refetchExperiments();
  }, [
    orgId,
    experimentData?.dataset.id,
    promptSubversionId,
    refetchExperiments,
  ]);

  const columnDefs = useMemo<ColDef[]>(() => {
    const columns: ColDef[] = [
      {
        field: "inputs",
        headerName: "Inputs",
        width: 200,
        suppressSizeToFit: true,
        cellRenderer: (params: any) => (
          <div>{JSON.stringify(params.data.inputs)}</div>
        ),
      },
    ];

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
          className="ag-theme-alpine"
          style={{ height: "80vh", width: "100%" }}
        >
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            enableCellTextSelection={true}
            suppressRowTransform={true}
            getRowId={getRowId}
          />
        </div>
        <Button variant="default" onClick={handleAddRow}>
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
    </div>
  );
}
