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
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { FreeTierLimitWrapper } from "@/components/shared/FreeTierLimitWrapper";
import { InfoBox } from "@/components/ui/helicone/infoBox";
import { P, Muted } from "@/components/ui/typography";
import { FreeTierLimitBanner } from "@/components/shared/FreeTierLimitBanner";

// Constants
const MAX_REQUESTS_PER_DATASET = 500; // Hard limit regardless of tier

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
  const [limitedRequestIds, setLimitedRequestIds] = useState(request_ids);
  const [selectedDataset, setSelectedDataset] = useState<
    (typeof datasets)[0] | undefined
  >(undefined);

  const datasetCount = datasets?.length || 0;
  const requestCount = request_ids.length;

  const { hasAccess, freeLimit: FREE_TIER_DATASET_LIMIT } = useFeatureLimit(
    "datasets",
    datasetCount
  );

  const { freeLimit: FREE_TIER_REQUEST_LIMIT } = useFeatureLimit(
    "datasets",
    requestCount,
    "requests"
  );

  // State to track which limit is enforcing restrictions
  const [limitType, setLimitType] = useState<
    | "none"
    | "free_tier_request_limit"
    | "free_tier_dataset_limit"
    | "hard_limit"
  >("none");

  const handleSelection = (id: string | "new") => {
    setSelectedOption(id);
    if (id !== "new") {
      setNewDatasetName("");
      const dataset = datasets.find((d) => d.id === id);
      setSelectedDataset(dataset);
      if (dataset) {
        // Check hard limit first (500 requests per dataset)
        if (dataset.requests_count >= MAX_REQUESTS_PER_DATASET) {
          setLimitedRequestIds([]);
          setLimitType("hard_limit");
        } else {
          // Apply the appropriate limit - hard limit or free tier limit
          const hardLimitRemaining =
            MAX_REQUESTS_PER_DATASET - dataset.requests_count;

          // For paid users, only apply hard limit
          if (hasAccess) {
            const newLimitedRequestIds = request_ids.slice(
              0,
              hardLimitRemaining
            );
            setLimitedRequestIds(newLimitedRequestIds);
            setLimitType(
              newLimitedRequestIds.length < request_ids.length
                ? "hard_limit"
                : "none"
            );
          } else {
            // For free tier users, apply the more restrictive of the two limits
            const freeTierRemaining = Math.max(
              0,
              FREE_TIER_REQUEST_LIMIT - dataset.requests_count
            );
            const effectiveLimit = Math.min(
              hardLimitRemaining,
              freeTierRemaining
            );
            const newLimitedRequestIds = request_ids.slice(0, effectiveLimit);
            setLimitedRequestIds(newLimitedRequestIds);

            if (newLimitedRequestIds.length < request_ids.length) {
              setLimitType(
                effectiveLimit === freeTierRemaining
                  ? "free_tier_request_limit"
                  : "hard_limit"
              );
            } else {
              setLimitType("none");
            }
          }
        }
      }
    } else {
      setSelectedDataset(undefined);
      // For new datasets
      const hardLimitRequestIds = request_ids.slice(
        0,
        MAX_REQUESTS_PER_DATASET
      );

      // For paid users, only apply hard limit
      if (hasAccess) {
        setLimitedRequestIds(hardLimitRequestIds);
        setLimitType(
          hardLimitRequestIds.length < request_ids.length
            ? "hard_limit"
            : "none"
        );
      } else if (datasetCount >= FREE_TIER_DATASET_LIMIT) {
        setLimitedRequestIds([]);
        setLimitType("free_tier_dataset_limit");
      } else if (
        requestCount + (selectedDataset?.requests_count || 0) >=
        FREE_TIER_REQUEST_LIMIT
      ) {
        setLimitedRequestIds([]);
        setLimitType("free_tier_request_limit");
      } else {
        setLimitedRequestIds(hardLimitRequestIds);
        setLimitType(
          hardLimitRequestIds.length < request_ids.length
            ? "hard_limit"
            : "none"
        );
      }
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

  // Render appropriate limit warning message
  const renderLimitWarning = () => {
    if (
      limitType === "none" ||
      limitedRequestIds.length === request_ids.length
    ) {
      return null;
    }

    if (limitType === "hard_limit") {
      return (
        <InfoBox variant="warning" className="mb-2">
          <div className="flex flex-col">
            <P className="font-medium">Dataset Size Limit</P>
            <Muted>
              {limitedRequestIds.length === 0
                ? `This dataset has reached the maximum capacity of ${MAX_REQUESTS_PER_DATASET} requests.`
                : `Only ${limitedRequestIds.length} of ${request_ids.length} requests will be added to stay within the limit of ${MAX_REQUESTS_PER_DATASET} requests per dataset.`}
            </Muted>
          </div>
        </InfoBox>
      );
    }

    if (limitType === "free_tier_request_limit") {
      return (
        <FreeTierLimitBanner
          feature="datasets"
          subfeature="requests"
          itemCount={
            Number(requestCount) +
            (Number(selectedDataset?.requests_count) || 0)
          }
          freeLimit={FREE_TIER_REQUEST_LIMIT}
          className="mb-2"
        />
      );
    }

    if (limitType === "free_tier_dataset_limit") {
      return (
        <FreeTierLimitBanner
          feature="datasets"
          itemCount={datasetCount}
          freeLimit={FREE_TIER_DATASET_LIMIT}
          className="mb-2"
        />
      );
    }
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
        {renderLimitWarning()}
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

          <FreeTierLimitWrapper feature="datasets" itemCount={datasetCount}>
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
                  : "Adding..."
                : isCopyMode
                ? `Copy ${limitedRequestIds.length} requests`
                : `Add ${limitedRequestIds.length} requests`}{" "}
            </Button>
          </FreeTierLimitWrapper>
        </div>
      </CardFooter>
    </Card>
  );
}
