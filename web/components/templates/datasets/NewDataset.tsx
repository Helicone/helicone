import { useState } from "react";
import { Check, Database, Plus } from "lucide-react";
import { Col, Row } from "../../layout/common";
import { useJawnClient } from "../../../lib/clients/jawnHook";
import useNotification from "../../shared/notification/useNotification";
import { NormalizedRequest } from "../requestsV2/builder/abstractRequestBuilder";
import { useGetHeliconeDatasets } from "../../../services/hooks/dataset/heliconeDataset";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import { useRouter } from "next/router";

// Assuming you have these UI components, if not, you'll need to create or import them
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
import { TextInput } from "@tremor/react";

interface NewDatasetProps {
  requests: NormalizedRequest[];
  onComplete: () => void;
}

export default function NewDataset({ requests, onComplete }: NewDatasetProps) {
  const [openCreateDataset, setOpenCreateDataset] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState("");
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const { setNotification } = useNotification();
  const jawn = useJawnClient();
  const { datasets, refetch: refetchDatasets } = useGetHeliconeDatasets();
  const [addingRequests, setAddingRequests] = useState(false);
  const [openDatasetOnAdd, setOpenDatasetOnAdd] = useLocalStorage(
    "openDatasetOnAdd",
    false
  );
  const router = useRouter();

  const handleDatasetSelection = (id: string) => {
    setSelectedDataset(id);
  };

  const handleCreateDataset = async () => {
    if (openCreateDataset) {
      const res = await jawn.POST("/v1/helicone-dataset", {
        body: {
          datasetName: newDatasetName,
          requestIds: [],
        },
      });
      if (res.data && res.data.data) {
        setNotification("Dataset created", "success");
        refetchDatasets();
        setSelectedDataset(res.data.data.datasetId);
        setOpenCreateDataset(false);
      } else {
        setNotification("Failed to create dataset", "error");
      }
    } else {
      setOpenCreateDataset(true);
    }
  };

  return (
    <Card className="w-[450px] border-none shadow-none p-0 m-0">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-2xl font-bold">Add to dataset</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-2 rounded-xl border border-[#F3F4F6] ">
        <ScrollArea className="h-[100px] ">
          {datasets.map((dataset) => (
            <div
              key={dataset.id}
              className={`flex items-center space-x-2 p-2 cursor-pointer rounded-lg ${
                selectedDataset === dataset.id
                  ? "bg-[#F1F5F9]"
                  : "hover:bg-accent"
              }`}
              onClick={() => handleDatasetSelection(dataset.id)}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                {selectedDataset === dataset.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex-1 flex items-center justify-between text-md font-medium leading-none">
                <span>{dataset.name}</span>
                <span className="text-muted-foreground">
                  <Database className="inline mr-1 h-4 w-4" />
                  {/* Assuming you have a count property, if not, you might need to adjust this */}
                  {/* {dataset.count || 0} */}
                </span>
              </div>
            </div>
          ))}
        </ScrollArea>
        <div
          className="flex items-center space-x-2 text-primary cursor-pointer border-t py-2 border-[#F3F4F6]"
          onClick={handleCreateDataset}
        >
          <span className="text-md font-medium ml-9">Create a new dataset</span>
        </div>
        {openCreateDataset && (
          <TextInput
            placeholder="Enter a name for the dataset"
            value={newDatasetName}
            onChange={(e) => setNewDatasetName(e.target.value)}
          />
        )}
      </CardContent>
      <CardFooter className="flex-col items-stretch space-y-4 py-2 px-0">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="open-after"
            checked={openDatasetOnAdd}
            onCheckedChange={setOpenDatasetOnAdd}
          />
          <label
            htmlFor="open-after"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Open dataset after
          </label>
        </div>
        <div className="flex justify-between w-full p-0">
          <Button variant="outline" onClick={onComplete}>
            Cancel
          </Button>
          <Button
            variant="default"
            disabled={!selectedDataset || addingRequests}
            onClick={async () => {
              setAddingRequests(true);
              const res = await jawn.POST(
                "/v1/helicone-dataset/{datasetId}/mutate",
                {
                  params: { path: { datasetId: selectedDataset! } },
                  body: {
                    addRequests: requests.map((r) => r.id),
                    removeRequests: [],
                  },
                }
              );

              if (res.data && !res.data.error) {
                setNotification("Requests added to dataset", "success");
                if (openDatasetOnAdd) {
                  router.push(`/datasets/${selectedDataset}`);
                }
                onComplete();
              } else {
                setNotification("Failed to add requests to dataset", "error");
              }
              setAddingRequests(false);
            }}
          >
            {addingRequests ? "Adding..." : `Add ${requests.length} requests`}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
