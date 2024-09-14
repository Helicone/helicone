import { ColDef, GridReadyEvent } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import { AgGridReact } from "ag-grid-react";
import { useCallback, useMemo, useState } from "react";
import { useExperiment } from "../../../../services/hooks/prompts/experiments";
import { usePrompt } from "../../../../services/hooks/prompts/prompts";
import HcBreadcrumb from "../../../ui/hcBreadcrumb";
import { PlayIcon, PlayPauseIcon } from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/components/layout/organizationContext";
import { getJawnClient } from "@/lib/clients/jawn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import PromptPlayground from "../id/promptPlayground";
import { useJawnClient } from "@/lib/clients/jawnHook";
import ProviderKeyList from "../../enterprise/portal/id/providerKeyList";
import { cn } from "@/lib/utils"; // Make sure you have this utility function for combining classes
import { Row } from "@/components/layout/common";
import { MessageContent } from "../../requests/chatComponent/single/MessageContent";

interface RowData {
  id: number;
  make: string;
  model: string;
  price: number;
  description: string;
}

const HeaderComponent = (props: any) => {
  const onRunClick = () => {
    console.log(`Run clicked for column: ${props.column.colId}`);
    // Add your run logic here
  };

  return (
    <div className="flex items-center justify-between w-full h-full px-2">
      <div>{props.displayName}</div>
      <button
        className="px-2 py-1 text-xs text-black border rounded hover:bg-gray-100"
        onClick={onRunClick}
      >
        <PlayIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

const AddColumnHeader = ({
  promptVersionId,
  experimentId,
  selectedProviderKey,
}: {
  promptVersionId: string;
  experimentId: string;
  selectedProviderKey: string | null;
}) => {
  const [open, setOpen] = useState(false);
  const jawn = useJawnClient();
  const promptVersion = useQuery({
    queryKey: ["promptVersion", promptVersionId],
    queryFn: async () => {
      return await jawn.GET(`/v1/prompt/version/{promptVersionId}`, {
        params: { path: { promptVersionId } },
      });
    },
  });

  return (
    <>
      <div className="flex items-center justify-center w-full h-full">
        <button
          className="p-1 text-gray-500 hover:text-gray-700"
          onClick={() => setOpen(true)}
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent size="large">
          <SheetHeader>
            <SheetTitle>Add New Column</SheetTitle>
            <SheetDescription>
              <PromptPlayground
                defaultEditMode={true}
                prompt={promptVersion.data?.data?.data?.helicone_template ?? ""}
                selectedInput={undefined}
                onSubmit={async (history, model) => {
                  console.log("Submitted history:", history);
                  console.log("Selected model:", model);
                  const promptData = {
                    model: model,
                    messages: history.map((msg) => ({
                      role: msg.role,
                      content: [
                        {
                          text: msg.content,
                          type: "text",
                        },
                      ],
                    })),
                  };

                  const result = await jawn.POST(
                    "/v1/prompt/version/{promptVersionId}/subversion",
                    {
                      params: {
                        path: {
                          promptVersionId: promptVersionId,
                        },
                      },
                      body: {
                        newHeliconeTemplate: JSON.stringify(promptData),
                        isMajorVersion: false,
                      },
                    }
                  );

                  if (result.error || !result.data) {
                    console.error(result);
                    return;
                  }

                  const newHypothesis = await jawn.POST(
                    "/v1/experiment/hypothesis",
                    {
                      body: {
                        experimentId: experimentId,
                        model: model,
                        promptVersion: promptVersionId,
                        providerKeyId: selectedProviderKey ?? "",
                        status: "RUNNING",
                      },
                    }
                  );

                  promptVersion.refetch();
                }}
                submitText="Test"
                initialModel={"gpt-4o"}
              />
            </SheetDescription>
          </SheetHeader>
          {/* Add form inputs here */}
          <SheetFooter>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
};

const AddRowCell = (props: any) => {
  const isLastRow = props.rowIndex === props.api.getDisplayedRowCount() - 1;

  if (!isLastRow) {
    return null;
  }

  return (
    <div className="flex items-center justify-center w-full h-full">
      <button className="p-1 text-gray-500 hover:text-gray-700">
        <PlusIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

interface AGGridTableProps {
  promptSubversionId: string;
  experimentId: string;
}

function AGGridTable(props: AGGridTableProps) {
  const org = useOrg();
  const { promptSubversionId, experimentId } = props;

  const experiments = useQuery({
    queryKey: ["experiments", org?.currentOrg?.id, experimentId],
    queryFn: async (query) => {
      const orgId = org?.currentOrg?.id;
      const experimentId = query.queryKey[2];
      const jawn = getJawnClient(orgId);
      const res = await jawn.POST("/v1/experiment/query", {
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
    },
  });

  const inputRecords = useQuery({
    queryKey: [
      "inputRecords",
      org?.currentOrg?.id,
      experiments.data?.dataset.id,
    ],
    queryFn: async (query) => {
      const orgId = org?.currentOrg?.id;
      const datasetId = query.queryKey[2];
      if (!datasetId) {
        return [];
      }
      const jawn = getJawnClient(orgId);
      const res = await jawn.POST(
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
    },
  });
  const rowData = useMemo(() => {
    return inputRecords.data?.map((row) => {
      const hypothesisRowData: Record<string, string> = {};

      experiments.data?.hypotheses.forEach((hypothesis) => {
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
  }, [inputRecords.data, experiments.data?.hypotheses]);

  const [wrapText, setWrapText] = useState(false);
  const [selectedProviderKey, setSelectedProviderKey] = useState<string | null>(
    null
  );

  const jawn = useJawnClient();
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "inputs",
        headerName: "Inputs",
        width: 200,
        suppressSizeToFit: true,
        cellRenderer: (params: any) => {
          return <div>{JSON.stringify(params.data.inputs)}</div>;
        },
      },
      ...(experiments.data?.hypotheses?.map((hypothesis) => ({
        field: hypothesis.id,
        headerName: hypothesis.id,
        width: 200,
        suppressSizeToFit: true,
        cellRenderer: (params: any) => {
          return (
            <div className="w-full h-full whitespace-pre-wrap">
              {params.data[hypothesis.id] ? (
                <div>
                  {
                    JSON.parse(params.data[hypothesis.id])?.body?.choices?.[0]
                      ?.message?.content
                  }
                </div>
              ) : (
                <div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      jawn.POST("/v1/experiment/run", {
                        body: {
                          experimentId: experimentId,
                          hypothesisId: hypothesis.id,
                          datasetRowIds: [params.data.dataset_row_id],
                        },
                      });
                    }}
                  >
                    <PlayIcon className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        },
        headerComponent: () => (
          <Row className="justify-between gap-3 items-center">
            <span>{hypothesis.id}</span>
            <Button
              variant="ghost"
              onClick={() => {
                jawn.POST("/v1/experiment/run", {
                  body: {
                    experimentId: experimentId,
                    hypothesisId: hypothesis.id,
                    datasetRowIds:
                      inputRecords.data?.map(
                        (row) => row.dataset_row_id ?? ""
                      ) ?? [],
                  },
                });
              }}
            >
              <PlayIcon className="w-4 h-4" />
            </Button>
          </Row>
        ),
      })) ?? []),
      {
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
            selectedProviderKey={selectedProviderKey}
          />
        ),
        cellRenderer: AddRowCell,
      },
    ],
    [
      experiments.data?.hypotheses,
      jawn,
      experimentId,
      inputRecords.data,
      promptSubversionId,
      selectedProviderKey,
    ]
  );

  const defaultColDef = useMemo(
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

  return (
    <div className="flex flex-col space-y-2">
      <ProviderKeyList
        variant="basic"
        setProviderKeyCallback={setSelectedProviderKey}
      />

      <button
        className="px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => setWrapText(!wrapText)}
      >
        {wrapText ? "Disable" : "Enable"} Word Wrap
      </button>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded"
        onClick={async () => {
          const jawn = getJawnClient(org?.currentOrg?.id);
          const res = await jawn.POST(
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
                  datasetId: experiments.data?.dataset.id ?? "",
                },
              },
            }
          );
          experiments.refetch();
        }}
      >
        Add row
      </button>
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
    </div>
  );
}

interface PromptIdPageProps {
  id: string;
  promptSubversionId: string;
  experimentId: string;
}

const ExperimentTablePage = (props: PromptIdPageProps) => {
  const { id, promptSubversionId, experimentId } = props;

  return (
    <>
      <div className="flex flex-col w-full space-y-4">
        <HcBreadcrumb
          pages={[
            {
              href: "/prompts",
              name: "Prompts",
            },
          ]}
        />
        <AGGridTable
          promptSubversionId={promptSubversionId}
          experimentId={experimentId}
        />
      </div>
    </>
  );
};

export default ExperimentTablePage;
