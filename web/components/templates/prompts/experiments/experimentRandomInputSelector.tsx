import { useMemo, useState } from "react";
import ThemedDrawer from "../../../shared/themed/themedDrawer";
import { useJawnClient } from "../../../../lib/clients/jawnHook";
import useNotification from "../../../shared/notification/useNotification";
import PromptPropertyCard from "../id/promptPropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";

interface ExperimentInputSelectorProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  promptVersionId: string | undefined;
  datasetId: string;
  onSuccess?: (success: boolean) => void;
  handleAddRows: (
    rows: {
      inputRecordId: string;
      datasetId: string;
      inputs: Record<string, string>;
    }[]
  ) => void;
}

export const ExperimentRandomInputSelector = (
  props: ExperimentInputSelectorProps
) => {
  const { open, setOpen, promptVersionId, onSuccess } = props;
  const jawn = useJawnClient();
  const { setNotification } = useNotification();

  const [numberInput, setNumberInput] = useState(10); // Default to 10 inputs

  // Fetch random input records using useQuery
  const {
    data: randomInputRecordsData,
    isLoading,
    isError,
  } = useQuery(
    ["randomInputRecords", promptVersionId],
    async () => {
      const res = await jawn.POST(
        "/v1/prompt/version/{promptVersionId}/inputs/query",
        {
          params: {
            path: {
              promptVersionId: promptVersionId ?? "",
            },
          },
          body: {
            limit: 100,
            random: true,
          },
        }
      );
      return res.data?.data ?? [];
    },
    {
      enabled: open && promptVersionId !== undefined, // Fetch only when the drawer is open
    }
  );

  // Process and select the desired number of random inputs
  const selectedRandomInputs = useMemo(() => {
    if (!randomInputRecordsData) return [];

    // Shuffle the records
    const shuffled = [...randomInputRecordsData].sort(
      () => Math.random() - 0.5
    );

    // Select the number of inputs specified by numberInput
    return shuffled.slice(0, numberInput).map((row) => ({
      id: row.id,
      inputs: row.inputs,
      source_request: row.source_request,
      prompt_version: row.prompt_version,
      created_at: row.created_at,
      response: row.response_body,
    }));
  }, [randomInputRecordsData, numberInput]);

  return (
    <ThemedDrawer open={open} setOpen={setOpen}>
      <div className="h-full flex flex-col space-y-4 justify-between w-full">
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-xl">
              Randomized Inputs ({selectedRandomInputs.length})
            </h2>
          </div>
          <p className="text-gray-500 text-sm pb-4">
            Select the inputs you want to include in the dataset.
          </p>

          <div className="flex items-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNumberInput((prev) => Math.max(prev - 1, 1))}
              className="border p-2 mr-2"
            >
              -
            </Button>
            <Input
              type="number"
              value={numberInput}
              onChange={(e) => {
                const value = e.target.value.replace(/^0+/, ""); // Remove leading zeros
                setNumberInput(Number(value) || 1);
              }}
              className="border p-2 mr-2 w-10 h-full"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNumberInput((prev) => prev + 1)}
              className="border p-2 mr-2"
            >
              +
            </Button>
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Random Inputs
            </span>
          </div>

          <ul className="flex flex-col items-center space-y-4 w-full pt-4 overflow-y-auto">
            {isLoading && <div>Loading inputs...</div>}
            {isError && <div>Error loading inputs.</div>}
            {!isLoading &&
              !isError &&
              selectedRandomInputs.map((request) => (
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
          <Button
            variant={"secondary"}
            size={"sm"}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>

          <Button
            variant={"default"}
            size={"sm"}
            onClick={async () => {
              await props.handleAddRows(
                selectedRandomInputs.map((request) => ({
                  inputRecordId: request.id,
                  datasetId: props.datasetId ?? "",
                  inputs: request.inputs,
                }))
              );

              if (onSuccess) {
                onSuccess(true);

                setNotification("Added inputs to dataset", "success");
                setOpen(false);
              }
            }}
          >
            Confirm
          </Button>
        </div>
      </div>
    </ThemedDrawer>
  );
};
