import { useEffect, useState, useMemo } from "react";
import ThemedDrawer from "../../../shared/themed/themedDrawer";
import { useJawnClient } from "../../../../lib/clients/jawnHook";
import useNotification from "../../../shared/notification/useNotification";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { CardContent } from "@/components/ui/card";
import { Card } from "@/components/ui/card";

interface ExperimentDatasetSelectorProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  promptVersionId: string | undefined;
  onSuccess?: (success: boolean) => void;
  handleAddRows: (datasetId: string) => void;
  experimentId: string;
}

const ExperimentDatasetSelector = (props: ExperimentDatasetSelectorProps) => {
  const {
    open,
    setOpen,
    promptVersionId,
    onSuccess,
    handleAddRows,
    experimentId,
  } = props;
  const jawn = useJawnClient();
  const { setNotification } = useNotification();

  // State to track selected inputs
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>();

  // Fetch input records using useQuery
  const {
    data: datasetsData,
    isLoading,
    isError,
  } = useQuery(
    ["datasets", promptVersionId],
    async () => {
      const res = await jawn.POST("/v1/helicone-dataset/query", {
        body: {
          datasetIds: [],
        },
      });
      return res.data?.data ?? [];
    },
    {
      enabled: open && promptVersionId !== undefined, // Fetch only when the drawer is open
    }
  );

  // Process input records
  const datasets = useMemo(() => {
    if (!datasetsData) return [];
    return datasetsData.map((record) => ({
      id: record.id,
      name: record.name,
      createdAt: record.created_at,
      requestsCount: record.requests_count,
    }));
  }, [datasetsData]);

  // Update selected requests when inputRecords change
  useEffect(() => {
    if (datasets.length > 0) {
      setSelectedDatasetId(""); // Initialize with no requests selected
    }
  }, [datasets]);

  return (
    <ThemedDrawer open={open} setOpen={setOpen}>
      <div className="h-full flex flex-col space-y-4 justify-between w-full">
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-xl">
              Select Datasets ({datasets.length})
            </h2>
          </div>
          <p className="text-gray-500 text-sm pb-4">
            Select the inputs you want to include in the dataset.
          </p>

          <ul className="flex flex-col items-center space-y-4 w-full pt-4 px-1 overflow-y-auto">
            {isLoading && <div>Loading inputs...</div>}
            {isError && <div>Error loading inputs.</div>}
            {!isLoading &&
              !isError &&
              datasets.map((dataset) => (
                <li
                  key={dataset.id}
                  className={clsx("w-full flex items-start")}
                  onClick={() => {}}
                >
                  <input
                    type="radio"
                    className="mt-2 mr-2 rounded border-slate-300 dark:border-slate-700"
                    checked={selectedDatasetId === dataset.id}
                    onChange={() => setSelectedDatasetId(dataset.id)}
                  />
                  <Card
                    className={clsx(
                      selectedDatasetId === dataset.id
                        ? "bg-sky-100 border-sky-500 dark:bg-sky-950"
                        : "bg-white border-slate-300 dark:bg-black dark:border-slate-700",
                      "w-full border-t px-4 py-2 "
                    )}
                  >
                    <CardContent className="p-0 relative">
                      <p className="text-sm font-semibold">{dataset.name}</p>
                      <p className="text-xs text-slate-500">
                        {dataset.requestsCount} requests
                      </p>
                    </CardContent>
                  </Card>
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
              if (!selectedDatasetId) {
                setNotification("Please select one input.", "error");
                return;
              }

              await handleAddRows(selectedDatasetId);
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

export default ExperimentDatasetSelector;
