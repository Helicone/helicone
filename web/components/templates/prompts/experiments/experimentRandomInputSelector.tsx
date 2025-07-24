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
  onSuccess?: (success: boolean) => void;
  handleAddRows: (
    rows: {
      inputRecordId: string;
      inputs: Record<string, string>;
      autoInputs: any[];
    }[],
  ) => void;
}

export const ExperimentRandomInputSelector = (
  props: ExperimentInputSelectorProps,
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
  } = useQuery({
    queryKey: ["randomInputRecords", promptVersionId],
    queryFn: async () => {
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
        },
      );
      return res.data?.data ?? [];
    },
    enabled: open && promptVersionId !== undefined, // Fetch only when the drawer is open
  });

  // Process and select the desired number of random inputs
  const selectedRandomInputs = useMemo(() => {
    if (!randomInputRecordsData) return [];

    // Shuffle the records
    const shuffled = [...randomInputRecordsData].sort(
      () => Math.random() - 0.5,
    );

    // Select the number of inputs specified by numberInput
    return shuffled.slice(0, numberInput).map((row) => ({
      id: row.id,
      inputs: row.inputs,
      source_request: row.source_request,
      prompt_version: row.prompt_version,
      created_at: row.created_at,
      response: row.response_body,
      autoInputs: row.auto_prompt_inputs,
    }));
  }, [randomInputRecordsData, numberInput]);

  return (
    <ThemedDrawer open={open} setOpen={setOpen}>
      <div className="flex h-full w-full flex-col justify-between space-y-4">
        <div className="flex w-full flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Randomized Inputs ({selectedRandomInputs.length})
            </h2>
          </div>
          <p className="pb-4 text-sm text-gray-500">
            Select the inputs you want to include in the dataset.
          </p>

          <div className="mb-4 flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNumberInput((prev) => Math.max(prev - 1, 1))}
              className="mr-2 border p-2"
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
              className="mr-2 h-full w-10 border p-2"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNumberInput((prev) => prev + 1)}
              className="mr-2 border p-2"
            >
              +
            </Button>
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Random Inputs
            </span>
          </div>

          <ul className="flex w-full flex-col items-center space-y-4 overflow-y-auto pt-4">
            {isLoading && <div>Loading inputs...</div>}
            {isError && <div>Error loading inputs.</div>}
            {!isLoading &&
              !isError &&
              selectedRandomInputs.map((request) => (
                <li key={request.id} className="flex w-full items-start">
                  <PromptPropertyCard
                    autoInputs={request.autoInputs}
                    isSelected={true}
                    requestId={request.source_request}
                    createdAt={request.created_at}
                    properties={request.inputs}
                  />
                </li>
              ))}
          </ul>
        </div>

        <div className="sticky bottom-0 flex justify-end space-x-4 bg-white py-4 pb-20 dark:bg-black">
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
                  inputs: request.inputs,
                  autoInputs: request.autoInputs,
                })),
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
