import { useMemo, useState } from "react";
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

export const ExperimentRandomInputSelector = (
  props: ExperimentInputSelectorProps
) => {
  const { open, setOpen, requestIds, onSuccess } = props;
  const jawn = useJawnClient();
  const { setNotification } = useNotification();

  const [numberInput, setNumberInput] = useState(10); // New state for number input

  // TODO We should use a hook to fetch the requests from the API
  const shuffledRequests = useMemo(
    () =>
      requestIds?.sort(() => Math.random() - 0.5).slice(0, numberInput) ?? [],
    [requestIds, numberInput]
  );

  return (
    <ThemedDrawer open={open} setOpen={setOpen}>
      <div className="h-full flex flex-col space-y-4 justify-between w-full">
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-xl">
              Randomized Inputs ({requestIds?.length})
            </h2>
          </div>
          <p className="text-gray-500 text-sm pb-4">
            Select the inputs you want to include in the dataset.
          </p>

          <div className="flex items-center mb-4">
            <button
              onClick={() => setNumberInput((prev) => Math.max(prev - 1, 0))}
              className="border p-2 mr-2"
            >
              -
            </button>
            <input
              type="number"
              value={numberInput}
              onChange={(e) => {
                const value = e.target.value.replace(/^0+/, ""); // Remove leading zeros
                setNumberInput(Number(value));
              }}
              className="border p-2 mr-2 w-10"
            />
            <button
              onClick={() => setNumberInput((prev) => prev + 1)}
              className="border p-2 mr-2"
            >
              +
            </button>
            <span>Random Inputs</span>
          </div>

          <ul className="flex flex-col items-center space-y-4 w-full pt-4 overflow-y-auto">
            {shuffledRequests.map((request) => (
              <li key={request.id} className="w-full flex items-start">
                <PromptPropertyCard
                  autoInputs={request.inputs}
                  isSelected={true}
                  requestId={request.source_request}
                  createdAt={request.created_at}
                  properties={request.inputs}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end space-x-4 sticky bottom-0 py-4 bg-white pb-20">
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
              await Promise.all(
                shuffledRequests.map((request) => {
                  return jawn.POST(
                    "/v1/experiment/dataset/{datasetId}/row/insert",
                    {
                      body: {
                        inputRecordId: request.id,
                      },
                      params: {
                        path: {
                          datasetId: props.meta?.datasetId ?? "",
                        },
                      },
                    }
                  );
                })
              );

              if (onSuccess) {
                onSuccess(true);

                setNotification("Added inputs to dataset", "success");
                setOpen(false);
              }
            }}
          />
        </div>
      </div>
    </ThemedDrawer>
  );
};
