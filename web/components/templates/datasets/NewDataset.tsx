import { useState, useRef, useEffect } from "react";
import { Check, DatabaseIcon } from "lucide-react"; // Add DatabaseIcon import
import { TableCellsIcon } from "@heroicons/react/24/outline";
import { useJawnClient } from "../../../lib/clients/jawnHook";
import useNotification from "../../shared/notification/useNotification";
import { useGetHeliconeDatasets } from "../../../services/hooks/dataset/heliconeDataset";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import { useRouter } from "next/router";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { ScrollArea } from "../../ui/scroll-area";
import { Checkbox } from "../../ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "../../ui/label";

interface NewDatasetProps {
  request_ids: string[];
  onComplete: () => void;
  isCopyMode?: boolean;
}

export default function NewDataset({
  request_ids,
  onComplete,
  isCopyMode = false,
}: NewDatasetProps) {
  const [selectedOption, setSelectedOption] = useState<string | "new" | null>(
    null
  );
  const [newDatasetName, setNewDatasetName] = useState("");
  const { setNotification } = useNotification();
  const jawn = useJawnClient();
  const {
    datasets,
    refetch: refetchDatasets,
    isLoading: isDatasetsLoading,
  } = useGetHeliconeDatasets();
  const [addingRequests, setAddingRequests] = useState(false);
  const [openDatasetOnAdd, setOpenDatasetOnAdd] = useLocalStorage(
    "openDatasetOnAdd",
    false
  );
  const router = useRouter();

  const newDatasetInputRef = useRef<HTMLInputElement>(null);

  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [limitedRequestIds, setLimitedRequestIds] = useState(request_ids);

  const handleSelection = (id: string | "new") => {
    setSelectedOption(id);
    if (id !== "new") {
      setNewDatasetName("");
      const selectedDataset = datasets.find((d) => d.id === id);
      if (selectedDataset) {
        if (selectedDataset.requests_count >= 500) {
          setShowLimitWarning(true);
          setLimitedRequestIds([]);
        } else {
          const remainingSlots = 500 - selectedDataset.requests_count;
          const newLimitedRequestIds = request_ids.slice(0, remainingSlots);
          setLimitedRequestIds(newLimitedRequestIds);
          setShowLimitWarning(newLimitedRequestIds.length < request_ids.length);
        }
      }
    } else {
      const newLimitedRequestIds = request_ids.slice(0, 500);
      setLimitedRequestIds(newLimitedRequestIds);
      setShowLimitWarning(newLimitedRequestIds.length < request_ids.length);
    }
  };

  useEffect(() => {
    if (selectedOption === "new" && newDatasetInputRef.current) {
      newDatasetInputRef.current.focus();
    }
  }, [selectedOption]);

  const handleCreateDataset = async () => {
    if (selectedOption === "new" && newDatasetName) {
      const res = await jawn.POST("/v1/helicone-dataset", {
        body: {
          datasetName: newDatasetName,
          requestIds: [],
        },
      });
      if (res.data && res.data.data) {
        setNotification("Dataset created", "success");
        await refetchDatasets();
        return res.data.data.datasetId;
      } else {
        setNotification("Failed to create dataset", "error");
        return null;
      }
    }
    return null;
  };

  return (
    <Card className="w-[450px] border-none shadow-none p-0 m-0 space-y-4">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-2xl font-semibold">
          {isCopyMode ? "Copy to dataset" : "Add to dataset"}{" "}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700">
        {isDatasetsLoading ? (
          <div className="h-[115px] flex items-center justify-center">
            <p className="text-sm text-slate-700 dark:text-slate-100">
              Loading...
            </p>
          </div>
        ) : datasets.length > 0 ? (
          <ScrollArea className="h-[115px]">
            {datasets.map((dataset) => (
              <div
                key={dataset.id}
                className={`flex items-center space-x-2 p-2 cursor-pointer rounded-lg ${
                  selectedOption === dataset.id
                    ? "bg-[#F1F5F9] dark:bg-slate-700/50"
                    : "hover:bg-accent dark:hover:bg-slate-700/50"
                }`}
                onClick={() => handleSelection(dataset.id)}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  {selectedOption === dataset.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 flex items-center justify-between text-md font-normal leading-none">
                  <span className="text-[#334155]">
                    {dataset.name || "Untitled"}
                  </span>
                  <span className="text-muted-foreground text-[#6B7280] items-center flex">
                    <TableCellsIcon className="inline mr-1 h-4 w-4" />
                    {dataset.requests_count || 0}
                  </span>
                </div>
              </div>
            ))}
          </ScrollArea>
        ) : (
          <div className="h-[115px] flex flex-col items-center justify-center">
            <DatabaseIcon className="h-12 w-12 text-slate-700 dark:text-slate-300" />
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
              No Datasets
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
              Create your first dataset below
            </p>
          </div>
        )}
        <div className="border-t border-[#E2E8F0] pt-1">
          <div
            className={`flex items-center space-x-2 p-2 cursor-pointer rounded-lg ${
              selectedOption === "new"
                ? "bg-[#F1F5F9] dark:bg-slate-700/50 text-slate-700 dark:text-slate-300"
                : "hover:bg-accent dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300"
            }`}
            onClick={() => handleSelection("new")}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              {selectedOption === "new" && (
                <Check className="h-4 w-4 text-primary dark:text-slate-700" />
              )}
            </div>
            <span className="text-md font-normal text-[#334155]">
              Create a new dataset
            </span>
          </div>
        </div>
        {selectedOption === "new" && (
          <div className="pl-7">
            <Label htmlFor="new-dataset-name">Dataset name</Label>
            <Input
              id="new-dataset-name"
              value={newDatasetName}
              onChange={(e) => setNewDatasetName(e.target.value)}
              ref={newDatasetInputRef}
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-stretch space-y-4 py-2 px-0">
        {showLimitWarning && (
          <div className="flex space-x-2 flex-col text-sm bg-[#F1F5F9] p-2 rounded-lg">
            <span className="ml-2 font-medium text-lg">Note</span>
            <span className="text-[#64748B]">
              {limitedRequestIds.length === 0
                ? "This dataset already has 500 or more requests. Please select or create a different dataset."
                : `Only ${limitedRequestIds.length} requests will be added to stay within the limit of 500 requests per dataset.`}
            </span>
          </div>
        )}
        <div className="flex justify-end items-center space-x-2">
          <label
            htmlFor="open-after"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 dark:text-slate-300"
          >
            Open dataset after
          </label>
          <Checkbox
            id="open-after"
            checked={openDatasetOnAdd}
            onCheckedChange={setOpenDatasetOnAdd}
          />
        </div>
        <div className="flex justify-between w-full p-0">
          <Button variant="outline" onClick={onComplete}>
            Cancel
          </Button>
          <Button
            variant="default"
            disabled={
              !selectedOption ||
              (selectedOption === "new" && !newDatasetName) ||
              addingRequests ||
              limitedRequestIds.length === 0
            }
            onClick={async () => {
              setAddingRequests(true);
              let datasetId = selectedOption;
              if (selectedOption === "new") {
                const newDatasetId = await handleCreateDataset();
                if (newDatasetId) {
                  datasetId = newDatasetId;
                } else {
                  setAddingRequests(false);
                  return;
                }
              }
              const res = await jawn.POST(
                "/v1/helicone-dataset/{datasetId}/mutate",
                {
                  params: { path: { datasetId: datasetId! } },
                  body: {
                    addRequests: limitedRequestIds,
                    removeRequests: [],
                  },
                }
              );

              if (res.data && !res.data.error) {
                setNotification("Requests added to dataset", "success");
                if (openDatasetOnAdd) {
                  router.push(`/datasets/${datasetId}`);
                }
                onComplete();
              } else {
                setNotification("Failed to add requests to dataset", "error");
              }
              setAddingRequests(false);
            }}
          >
            {addingRequests
              ? isCopyMode
                ? "Copying..."
                : "Adding..." // Modify this line
              : isCopyMode
              ? `Copy ${limitedRequestIds.length} requests` // Add this line
              : `Add ${limitedRequestIds.length} requests`}{" "}
            {/* Modify this line */}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
