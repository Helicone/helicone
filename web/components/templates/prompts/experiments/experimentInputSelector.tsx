import { useEffect, useState, useMemo } from "react";
import ThemedDrawer from "../../../shared/themed/themedDrawer";
import { useJawnClient } from "../../../../lib/clients/jawnHook";
import useNotification from "../../../shared/notification/useNotification";
import PromptPropertyCard from "../id/promptPropertyCard";
import { Button } from "@/components/ui/button";
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
    }[]
  ) => void;
}

const ExperimentInputSelector = (props: ExperimentInputSelectorProps) => {
  const { open, setOpen, promptVersionId, onSuccess, handleAddRows } = props;
  const jawn = useJawnClient();
  const { setNotification } = useNotification();

  // State to track selected inputs
  const [selectedRequests, setSelectedRequests] = useState<any[]>([]);

  // State to track if all items are selected
  const [isAllSelected, setIsAllSelected] = useState(false);

  // Fetch input records using useQuery
  const {
    data: inputRecordsData,
    isLoading,
    isError,
  } = useQuery(
    ["inputRecords", promptVersionId],
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
            limit: 1000, // Adjust limit as needed
          },
        }
      );
      return res.data?.data ?? [];
    },
    {
      enabled: open && promptVersionId !== undefined, // Fetch only when the drawer is open
    }
  );

  // Process input records
  const inputRecords = useMemo(() => {
    if (!inputRecordsData) return [];
    return inputRecordsData.map((record) => ({
      id: record.id,
      inputs: record.inputs,
      source_request: record.source_request,
      prompt_version: record.prompt_version,
      created_at: record.created_at,
      response: record.response_body,
      autoInputs: record.auto_prompt_inputs,
    }));
  }, [inputRecordsData]);

  // Update selected requests when inputRecords change
  useEffect(() => {
    if (inputRecords.length > 0) {
      setSelectedRequests([]); // Initialize with no requests selected
      setIsAllSelected(false); // Reset the select all state
    }
  }, [inputRecords]);

  const handleToggleRequest = (id: string) => {
    const request = inputRecords.find((r) => r.id === id);
    if (!request) return;

    setSelectedRequests((prevSelected) => {
      const exists = prevSelected.some((req) => req.id === id);
      if (exists) {
        // Remove the request from selectedRequests
        const newSelected = prevSelected.filter((req) => req.id !== id);
        // Update isAllSelected if not all items are selected
        if (newSelected.length !== inputRecords.length) {
          setIsAllSelected(false);
        }
        return newSelected;
      } else {
        // Add the request to selectedRequests
        const newSelected = [...prevSelected, request];
        // Update isAllSelected if all items are selected
        if (newSelected.length === inputRecords.length) {
          setIsAllSelected(true);
        }
        return newSelected;
      }
    });
  };

  // Handler for Select All button
  const handleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all
      setSelectedRequests([]);
      setIsAllSelected(false);
    } else {
      // Select all
      if (inputRecords) {
        setSelectedRequests(inputRecords);
        setIsAllSelected(true);
      }
    }
  };

  return (
    <ThemedDrawer open={open} setOpen={setOpen}>
      <div className="h-full flex flex-col space-y-4 justify-between w-full">
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-xl">
              Select Inputs ({inputRecords.length})
            </h2>
            <Button
              variant="secondary"
              size="sm"
              title={isAllSelected ? "Deselect All" : "Select All"}
              onClick={handleSelectAll}
            >
              {isAllSelected ? "Deselect All" : "Select All"}
            </Button>
          </div>
          <p className="text-gray-500 text-sm pb-4">
            Select the inputs you want to include in the dataset.
          </p>

          <ul className="flex flex-col items-center space-y-4 w-full pt-4 px-1 overflow-y-auto">
            {isLoading && <div>Loading inputs...</div>}
            {isError && <div>Error loading inputs.</div>}
            {!isLoading &&
              !isError &&
              inputRecords.map((request) => (
                <li key={request.id} className="w-full flex items-start">
                  <input
                    type="checkbox"
                    className="mt-2 mr-2 rounded border-slate-300 dark:border-slate-700"
                    checked={selectedRequests.some(
                      (req) => req.id === request.id
                    )}
                    onChange={() => handleToggleRequest(request.id)}
                  />
                  <PromptPropertyCard
                    autoInputs={request.autoInputs}
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
          <Button
            variant={"secondary"}
            size={"sm"}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>

          <Button
            size={"sm"}
            onClick={async () => {
              if (selectedRequests.length === 0) {
                setNotification("Please select at least one input.", "error");
                return;
              }

              await handleAddRows(
                selectedRequests.map((request) => ({
                  inputRecordId: request.id,
                  inputs: request.inputs,
                  autoInputs: request.autoInputs,
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

export default ExperimentInputSelector;
