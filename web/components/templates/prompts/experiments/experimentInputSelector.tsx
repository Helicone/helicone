import { useEffect, useState } from "react";
import ThemedDrawer from "../../../shared/themed/themedDrawer";
import { useJawnClient } from "../../../../lib/clients/jawnHook";
import useNotification from "../../../shared/notification/useNotification";
import PromptPropertyCard from "../id/promptPropertyCard";
import { Button } from "@/components/ui/button";

type DatasetRequest = {
  id: string;
  inputs: { [key: string]: string };
  source_request: string;
  prompt_version: string;
  created_at: string;
};

interface ExperimentInputSelectorProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  setShowRandomInputSelector: (open: boolean) => void;
  requestIds?: DatasetRequest[];
  onSuccess?: (success: boolean) => void;
  numberOfRows: number;
  handleAddRows: (
    rows: {
      inputRecordId: string;
      datasetId: string;
      inputs: Record<string, string>;
    }[]
  ) => void;
  meta?: {
    promptVersionId?: string;
    datasetId?: string;
    originalColumnId?: string;
  };
}

const ExperimentInputSelector = (props: ExperimentInputSelectorProps) => {
  const { open, setOpen, requestIds, onSuccess, handleAddRows } = props;
  const jawn = useJawnClient();
  const { setNotification } = useNotification();

  const [selectedRequests, setSelectedRequests] = useState<DatasetRequest[]>(
    []
  );

  // New state to track if all items are selected
  const [isAllSelected, setIsAllSelected] = useState(false);

  useEffect(() => {
    if (requestIds) {
      setSelectedRequests([]); // Initialize with no requests selected
      setIsAllSelected(false); // Reset the select all state
    }
  }, [requestIds]);

  const handleToggleRequest = (id: string) => {
    const request = requestIds?.find((r) => r.id === id);
    if (!request) return;

    setSelectedRequests((prevSelected) => {
      const exists = prevSelected.some((req) => req.id === id);
      if (exists) {
        // Remove the request from selectedRequests
        const newSelected = prevSelected.filter((req) => req.id !== id);
        // Update isAllSelected if not all items are selected
        if (newSelected.length !== requestIds?.length) {
          setIsAllSelected(false);
        }
        return newSelected;
      } else {
        // Add the request to selectedRequests
        const newSelected = [...prevSelected, request];
        // Update isAllSelected if all items are selected
        if (newSelected.length === requestIds?.length) {
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
      if (requestIds) {
        setSelectedRequests(requestIds);
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
              Select Inputs ({requestIds?.length})
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
            {requestIds?.map((request) => (
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

              await props.handleAddRows(
                selectedRequests.map((request) => ({
                  inputRecordId: request.id,
                  datasetId: props.meta?.datasetId ?? "",
                  inputs: request.inputs,
                }))
              );

              if (onSuccess) {
                onSuccess(true);

                setNotification("Requests added to dataset", "success");
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
