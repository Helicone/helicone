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
  const { open, setOpen, promptVersionId, onSuccess, handleAddRows } = props;
  const jawn = useJawnClient();
  const { setNotification } = useNotification();

  // State to track selected inputs
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>();

  // Fetch input records using useQuery
  const {
    data: datasetsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["datasets", promptVersionId],
    queryFn: async () => {
      const res = await jawn.POST("/v1/helicone-dataset/query", {
        body: {
          datasetIds: [],
        },
      });
      return res.data?.data ?? [];
    },
    enabled: open && promptVersionId !== undefined, // Fetch only when the drawer is open
  });

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
      <div className="flex h-full w-full flex-col justify-between space-y-4">
        <div className="flex w-full flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Select Datasets ({datasets.length})
            </h2>
          </div>
          <p className="pb-4 text-sm text-gray-500">
            Select the inputs you want to include in the dataset.
          </p>

          <ul className="flex w-full flex-col items-center space-y-4 overflow-y-auto px-1 pt-4">
            {isLoading && <div>Loading inputs...</div>}
            {isError && <div>Error loading inputs.</div>}
            {!isLoading &&
              !isError &&
              datasets.map((dataset) => (
                <li
                  key={dataset.id}
                  className={clsx("flex w-full items-start")}
                  onClick={() => {}}
                >
                  <input
                    type="radio"
                    className="mr-2 mt-2 rounded border-slate-300 dark:border-slate-700"
                    checked={selectedDatasetId === dataset.id}
                    onChange={() => setSelectedDatasetId(dataset.id)}
                  />
                  <Card
                    className={clsx(
                      selectedDatasetId === dataset.id
                        ? "border-sky-500 bg-sky-100 dark:bg-sky-950"
                        : "border-slate-300 bg-white dark:border-slate-700 dark:bg-black",
                      "w-full border-t px-4 py-2",
                    )}
                  >
                    <CardContent className="relative p-0">
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

        <div className="sticky bottom-0 flex justify-end space-x-4 bg-white py-4">
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
