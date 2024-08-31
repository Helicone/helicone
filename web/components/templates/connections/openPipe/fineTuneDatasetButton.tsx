import { useState } from "react";
import {
  ArrowPathIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import { useOpenPipeKey } from "@/services/hooks/useOpenPipeKey";
import useOpenPipeClient from "@/lib/clients/openPipeClient";
import useNotification from "@/components/shared/notification/useNotification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import GenericButton from "@/components/layout/common/button";
import { LOGOS } from "../connectionSVG";

const SUPPORTED_MODELS = [
  "OpenPipe/Hermes-2-Theta-Llama-3-8B-32k",
  "meta-llama/Meta-Llama-3-8B-Instruct",
  "meta-llama/Meta-Llama-3-70B-Instruct",
  "OpenPipe/mistral-ft-optimized-1227",
  "mistralai/Mixtral-8x7B-Instruct-v0.1",
] as const;

interface OpenPipeFineTuneButtonProps {
  datasetId: string;
  rows: any[];
  datasetName: string;
  fetchRows?: () => Promise<any[]>;
}

export default function OpenPipeFineTuneButton(
  props: OpenPipeFineTuneButtonProps
) {
  const { datasetId, rows, datasetName, fetchRows } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [fineTuneName, setFineTuneName] = useState("");
  const [baseModel, setBaseModel] = useState<(typeof SUPPORTED_MODELS)[number]>(
    SUPPORTED_MODELS[0]
  );
  const [batchSize, setBatchSize] = useState<string>("auto");
  const [learningRateMultiplier, setLearningRateMultiplier] =
    useState<number>(1);
  const [numEpochs, setNumEpochs] = useState<number>(3);
  const [logs, setLogs] = useState<string[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { existingKey } = useOpenPipeKey();
  const openPipeClient = useOpenPipeClient({
    apiKey: existingKey?.provider_key || "",
  });
  const { setNotification } = useNotification();

  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  const handleFineTune = async () => {
    setIsLoading(true);
    setLogs([]);
    try {
      addLog("Starting fine-tuning process...");
      let dataToUpload = rows;
      if (fetchRows) {
        addLog("Fetching additional rows...");
        dataToUpload = await fetchRows();
        addLog(`Fetched ${dataToUpload.length} rows.`);
      }

      addLog("Creating dataset in OpenPipe...");
      const dataset = await openPipeClient.createDataset(datasetName);
      addLog(`Dataset created with ID: ${dataset.datasetId}`);

      addLog("Uploading data to OpenPipe...");
      await openPipeClient.createDatasetEntry(
        dataset.datasetId,
        rows?.map((row) => ({
          ...row.request_body,
          messages: [
            ...row.request_body.messages,
            row.response_body.choices[0].message,
          ],
        }))
      );
      addLog("Data uploaded successfully.");

      addLog("Creating fine-tune job...");
      const fineTune = await openPipeClient.createFinetune({
        datasetId: dataset.datasetId,
        slug: fineTuneName,
        baseModel,
        overrides: {
          batch_size: batchSize,
          learning_rate_multiplier: learningRateMultiplier,
          num_epochs: numEpochs,
        },
      });
      addLog(`Fine-tune job created with ID: ${fineTune.id}`);

      setNotification("Fine-tune job created successfully!", "success");
      setIsSheetOpen(false); // Close the sheet after successful completion
    } catch (error) {
      console.error("Error in fine-tuning process:", error);
      addLog(`Error: ${error}`);
      setNotification(
        "Error in fine-tuning process. Please try again.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <GenericButton
          text="OpenPipe"
          onClick={() => setIsSheetOpen(true)}
          icon={<LOGOS.OpenPipe className="w-4 h-4" />}
        />
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md" size="full">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold">
            Fine-tune with OpenPipe
          </SheetTitle>
          <SheetDescription className="text-sm text-gray-500">
            Configure your fine-tuning job for the dataset: {datasetName}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fineTuneName" className="text-sm font-medium">
              Fine-tune Name (Slug)
            </Label>
            <Input
              id="fineTuneName"
              value={fineTuneName}
              onChange={(e) => setFineTuneName(e.target.value)}
              placeholder="Enter a name for your fine-tuned model"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="baseModel" className="text-sm font-medium">
              Base Model
            </Label>
            <Select
              value={baseModel}
              onValueChange={(value) =>
                setBaseModel(value as (typeof SUPPORTED_MODELS)[number])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a base model" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_MODELS.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="batchSize" className="text-sm font-medium">
              Batch Size
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    id="batchSize"
                    value={batchSize}
                    onChange={(e) => setBatchSize(e.target.value)}
                    placeholder="auto"
                    className="w-full"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Number of samples processed in each training step. Use
                    &quot;auto&quot; for automatic selection.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="learningRateMultiplier"
              className="text-sm font-medium"
            >
              Learning Rate Multiplier
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="space-y-2">
                    <Slider
                      id="learningRateMultiplier"
                      min={0.1}
                      max={2}
                      step={0.1}
                      value={[learningRateMultiplier]}
                      onValueChange={(value) =>
                        setLearningRateMultiplier(value[0])
                      }
                    />
                    <span className="text-sm text-gray-500 block text-right">
                      {learningRateMultiplier.toFixed(1)}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Adjusts the learning rate. Higher values may lead to faster
                    learning but risk overshooting.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-2">
            <Label htmlFor="numEpochs" className="text-sm font-medium">
              Number of Epochs
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="space-y-2">
                    <Slider
                      id="numEpochs"
                      min={1}
                      max={10}
                      step={1}
                      value={[numEpochs]}
                      onValueChange={(value) => setNumEpochs(value[0])}
                    />
                    <span className="text-sm text-gray-500 block text-right">
                      {numEpochs}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Number of complete passes through the training dataset. More
                    epochs may improve results but increase training time.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button
            onClick={handleFineTune}
            disabled={isLoading}
            className="w-full mb-4"
          >
            {isLoading ? (
              <>
                <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                Processing
              </>
            ) : (
              "Start Fine-tuning"
            )}
          </Button>
        </div>
        {/* Log display */}
        {logs.length > 0 && (
          <div className="mt-4 p-2 bg-gray-100 rounded-md max-h-40 overflow-y-auto">
            <h3 className="text-sm font-semibold mb-2">Process Logs:</h3>
            {logs.map((log, index) => (
              <p key={index} className="text-xs text-gray-600">
                {log}
              </p>
            ))}
          </div>
        )}
        <div className="flex justify-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(logs.join("\n"));
                  }}
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Copy logs to clipboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </SheetContent>
    </Sheet>
  );
}
