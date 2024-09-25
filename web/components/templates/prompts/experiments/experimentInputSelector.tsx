import { useEffect, useState } from "react";
import ThemedDrawer from "../../../shared/themed/themedDrawer";
import HcButton from "../../../ui/hcButton";
import { useJawnClient } from "../../../../lib/clients/jawnHook";
import useNotification from "../../../shared/notification/useNotification";
import PromptPropertyCard from "../id/promptPropertyCard";

interface ExperimentInputSelectorProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  requestIds?: {
    id: string;
    inputs: {
      [key: string]: string;
    };
    source_request: string;
    prompt_version: string;
    created_at: string;
  }[];
  onSuccess?: (success: boolean) => void;
  meta?: {
    promptVersionId?: string;
    datasetId?: string;
  };
}

type DatasetRequest = {
  id: string;
  inputs: {
    [key: string]: string;
  };
  source_request: string;
  prompt_version: string;
  created_at: string;
};

const ExperimentInputSelector = (props: ExperimentInputSelectorProps) => {
  const { open, setOpen, requestIds, onSuccess } = props;
  const jawn = useJawnClient();
  const { setNotification } = useNotification();

  const [selectedRequests, setSelectedRequests] = useState<DatasetRequest[]>(
    []
  );

  useEffect(() => {
    if (requestIds) {
      setSelectedRequests([]); // Initialize with no requests selected
    }
  }, [requestIds]);

  const handleToggleRequest = (id: string) => {
    const request = requestIds?.find((r) => r.id === id);
    if (!request) return;

    setSelectedRequests((prevSelected) => {
      const exists = prevSelected.some((req) => req.id === id);
      if (exists) {
        // Remove the request from selectedRequests
        return prevSelected.filter((req) => req.id !== id);
      } else {
        // Add the request to selectedRequests
        return [...prevSelected, request];
      }
    });
  };

  return (
    <ThemedDrawer open={open} setOpen={setOpen}>
      <div className="h-full flex flex-col space-y-4 justify-between w-full">
        <div className="flex flex-col w-full">
          <div className="flex items-center space-x-2">
            <h2 className="font-semibold text-xl">
              Select Inputs ({requestIds?.length})
            </h2>
          </div>
          <p className="text-gray-500 text-sm pt-2">
            Select the inputs you want to include in the dataset.
          </p>

          <ul className="flex flex-col items-center space-y-4 w-full pt-4 max-h-96 overflow-y-auto">
            {requestIds?.map((request) => (
              <li key={request.id} className="w-full flex items-start">
                <input
                  type="checkbox"
                  className="mt-2 mr-2"
                  checked={selectedRequests.some(
                    (req) => req.id === request.id
                  )}
                  onChange={() => handleToggleRequest(request.id)}
                />
                <PromptPropertyCard
                  autoInputs={request.inputs}
                  isSelected={selectedRequests.some(
                    (req) => req.id === request.id
                  )}
                  requestId={request.source_request}
                  createdAt={request.created_at}
                  properties={request.inputs}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end space-x-4 sticky bottom-0 py-4 bg-white">
          <HcButton
            variant={"secondary"}
            size={"sm"}
            title={"Cancel"}
            onClick={() => setOpen(false)}
          />

          <HcButton
            variant={"primary"}
            size={"sm"}
            title={"Confirm"}
            onClick={async () => {
              if (selectedRequests.length === 0) {
                setNotification("Please select at least one input.", "error");
                return;
              }

              await Promise.all(
                selectedRequests.map((request) => {
                  return jawn.POST(
                    "/v1/experiment/dataset/{datasetId}/version/{promptVersionId}/row",
                    {
                      body: {
                        inputs: request.inputs,
                      },
                      params: {
                        path: {
                          promptVersionId: props.meta?.promptVersionId ?? "",
                          datasetId: props.meta?.datasetId ?? "",
                        },
                      },
                    }
                  );
                })
              );

              // const dataset = await jawn.POST("/v1/experiment/dataset", {
              //   body: {
              //     datasetName: `EXP-DATASET-${new Date().getTime()}`,
              //     requestIds: selectedRequests
              //       .map((request) => request.source_request)
              //       .filter(Boolean) as string[],
              //     meta: {
              //       promptVersionId: props.meta?.promptVersionId,
              //     },
              //     datasetType: "experiment",
              //   },
              // });
              // if (dataset.data?.error !== null) {
              //   setNotification(
              //     "Error creating dataset. Please try again",
              //     "error"
              //   );
              //   return;
              // }
              if (onSuccess) {
                onSuccess(true);

                // Pass selectedRequests to the onSuccess callback if needed
                // onSuccess(dataset.data?.data?.datasetId, selectedRequests);

                setNotification("Dataset created successfully", "success");
                setOpen(false);
              }
            }}
          />
        </div>
      </div>
    </ThemedDrawer>
  );
};

export default ExperimentInputSelector;
