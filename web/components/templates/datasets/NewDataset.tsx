import { useState } from "react";
import { Col, Row } from "../../layout/common";
import ThemedDropdown from "../../shared/themed/themedDropdown";
import { TextInput } from "@tremor/react";
import { useJawnClient } from "../../../lib/clients/jawnHook";
import useNotification from "../../shared/notification/useNotification";
import { NormalizedRequest } from "../requestsV2/builder/abstractRequestBuilder";
import { useGetHeliconeDatasets } from "../../../services/hooks/dataset/heliconeDataset";
import { Checkbox } from "@mui/material";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import { useRouter } from "next/router";

interface NewDatasetProps {
  requests: NormalizedRequest[];
  onComplete: () => void;
}

export default function NewDataset({ requests, onComplete }: NewDatasetProps) {
  const [openCreateDataset, setOpenCreateDataset] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState("");
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const { setNotification } = useNotification();
  const jawn = useJawnClient();
  const { datasets, refetch: refetchDatasets } = useGetHeliconeDatasets();

  const [addingRequests, setAddingRequests] = useState(false);

  const [openDatasetOnAdd, setOpenDatasetOnAdd] = useLocalStorage(
    "openDatasetOnAdd",
    false
  );

  const router = useRouter();
  return (
    <Col className="h-[500px] w-[500px] justify-between">
      <Col className="gap-5">
        <div>Select Dataset</div>

        <ThemedDropdown
          options={datasets
            .sort((a, b) => {
              return (
                new Date(b.created_at ?? 0).getTime() -
                new Date(a.created_at ?? 0).getTime()
              );
            })
            .map((dataset) => ({
              label: `${dataset.name} (${new Date(
                dataset.created_at ?? 0
              ).toLocaleString()})`,
              value: dataset.id,
            }))}
          onSelect={(value) => {
            setSelectedDataset(value);
          }}
          selectedValue={selectedDataset ?? ""}
          placeholder="Select Dataset"
        />
        <Col className="gap-2 ">
          {openCreateDataset && (
            <Col>
              <div>Dataset Name</div>
              <TextInput
                placeholder="Enter a name for the dataset"
                value={newDatasetName}
                onChange={(e) => setNewDatasetName(e.target.value)}
              />
            </Col>
          )}
          <button
            className="w-fit bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 hover:bg-sky-50 dark:hover:bg-sky-900"
            onClick={async () => {
              if (openCreateDataset) {
                const res = await jawn.POST("/v1/helicone-dataset", {
                  body: {
                    datasetName: newDatasetName,
                    requestIds: [],
                  },
                });
                if (res.data && res.data.data) {
                  setNotification("Dataset created", "success");
                  refetchDatasets();
                  setSelectedDataset(res.data.data.datasetId);
                  setOpenCreateDataset(false);
                } else {
                  setNotification("Failed to create dataset", "error");
                }
              } else {
                setOpenCreateDataset(true);
              }
            }}
          >
            {openCreateDataset ? "Create" : "Create New Dataset"}
          </button>
        </Col>
      </Col>
      <Col className="gap-5">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {selectedDataset
            ? `This will copy ${requests.length} requests to the "${
                datasets.find((d) => d.id === selectedDataset)?.name
              }" dataset.`
            : `Please select a dataset or create a new one.`}
        </div>
        <Row className="justify-end">
          <Col className="items-end gap-3">
            <Row className="justify-end gap-5">
              <button
                className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 hover:bg-sky-50 dark:hover:bg-sky-900"
                onClick={onComplete}
              >
                Cancel
              </button>
              {selectedDataset && (
                <button
                  className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 hover:bg-sky-50 dark:hover:bg-sky-900"
                  disabled={addingRequests}
                  onClick={async () => {
                    setAddingRequests(true);
                    const { data, error } = await jawn.POST(
                      "/v1/helicone-dataset/{datasetId}/mutate",
                      {
                        params: {
                          path: {
                            datasetId: selectedDataset,
                          },
                        },
                        body: {
                          addRequests: requests.map((r) => r.id),
                          removeRequests: [],
                        },
                      }
                    );

                    if (data && !data.error) {
                      setNotification("Requests added to dataset", "success");

                      if (openDatasetOnAdd) {
                        router.push(`/datasets/${selectedDataset}`);
                      }
                      onComplete();
                    } else {
                      setNotification(
                        `Failed to add requests to dataset: ${
                          (error as any)?.error ?? "Unknown error"
                        }`,
                        "error"
                      );
                    }
                    setAddingRequests(false);
                  }}
                >
                  {addingRequests
                    ? "Adding..."
                    : "Add " + requests.length + " requests"}
                </button>
              )}
            </Row>
            {selectedDataset && (
              <Row>
                <button
                  className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => setOpenDatasetOnAdd(!openDatasetOnAdd)}
                >
                  <i>open dataset</i>
                  <Checkbox
                    checked={openDatasetOnAdd}
                    onChange={(e) => setOpenDatasetOnAdd(e.target.checked)}
                    size="small"
                  />
                </button>
              </Row>
            )}
          </Col>
        </Row>
      </Col>
    </Col>
  );
}
