import { useEffect, useState } from "react";
import ThemedDrawer from "../../../shared/themed/themedDrawer";
import HcButton from "../../../ui/hcButton";
import PromptPropertyCard from "./promptPropertyCard";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useJawnClient } from "../../../../lib/clients/jawnHook";
import useNotification from "../../../shared/notification/useNotification";

interface SelectRandomDatasetProps {
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
  onSuccess?: (dataSetId: string | undefined) => void;
}

const RANDOM_SAMPLE_SIZE = 10;

const SelectRandomDataset = (props: SelectRandomDatasetProps) => {
  const { open, setOpen, requestIds, onSuccess } = props;
  const jawn = useJawnClient();
  const { setNotification } = useNotification();

  const [selectedRequests, setSelectedRequests] = useState<
    {
      id: string;
      inputs: {
        [key: string]: string;
      };
      source_request: string;
      prompt_version: string;
      created_at: string;
    }[]
  >();

  useEffect(() => {
    if (requestIds) {
      const copy = JSON.parse(JSON.stringify(requestIds));

      setSelectedRequests(
        copy.sort(() => 0.5 - Math.random()).slice(0, RANDOM_SAMPLE_SIZE)
      );
    }
  }, [requestIds]);

  return (
    <ThemedDrawer open={open} setOpen={setOpen}>
      <div className="h-full flex flex-col space-y-4 justify-between w-full">
        <div className="flex flex-col w-full">
          <div className="flex items-center space-x-2">
            <h2 className="font-semibold text-xl">Confirm - Random Dataset</h2>
            <button
              // generate a new set of random requests
              onClick={() => {
                if (requestIds) {
                  // make a deep copy of requestIds
                  const copy = JSON.parse(JSON.stringify(requestIds));
                  setSelectedRequests(
                    copy
                      .sort(() => 0.5 - Math.random())
                      .slice(0, RANDOM_SAMPLE_SIZE)
                  );
                }
              }}
            >
              <ArrowPathIcon className="h-4 w-4 text-gray-500 hover:text-black" />
            </button>
          </div>
          <p className="text-gray-500 text-sm pt-2">
            Removing a request will replace it from the dataset with another
            random request.
          </p>

          <ul className="flex flex-col items-center space-y-4 w-full pt-4">
            {selectedRequests?.map((request) => (
              <li key={request.id} className="w-full">
                <PromptPropertyCard
                  isSelected={false}
                  onRemove={() => {
                    const copy = JSON.parse(JSON.stringify(selectedRequests));

                    const randomRequest = requestIds?.find(
                      (r) => !copy.find((s: any) => s.id === r.id)
                    );

                    const index = copy.findIndex(
                      (r: any) => r.id === request.id
                    );
                    copy[index] = randomRequest;

                    setSelectedRequests(copy);
                  }}
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
              const dataset = await jawn.POST("/v1/experiment/dataset", {
                body: {
                  datasetName: `EXP-DATASET-${new Date().getTime()}`,
                  requestIds:
                    selectedRequests?.map((r) => r.source_request) ?? [],
                },
              });
              if (dataset.data?.error !== null) {
                setNotification(
                  "Error creating dataset. Please try again",
                  "error"
                );
                return;
              }
              if (onSuccess) {
                onSuccess(dataset.data?.data?.datasetId);
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

export default SelectRandomDataset;
