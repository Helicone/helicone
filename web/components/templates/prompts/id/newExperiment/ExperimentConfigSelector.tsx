import React from "react";
import { Select, SelectItem } from "@tremor/react";
import ProviderKeyList from "../../../enterprise/portal/id/providerKeyList";
import SelectRandomDataset from "../selectRandomDataset";
import { Prompt } from "./types";
import { useJawnClient } from "../../../../../lib/clients/jawnHook";
import useNotification from "../../../../shared/notification/useNotification";
import { PlaygroundModel } from "../../../playground/playgroundPage";
import { Button } from "@/components/ui/button";

interface Dataset {
  id: string;
  name: string;
}

interface ExperimentConfigSelectorProps {
  datasets: Dataset[];
  selectedDatasetId: string | undefined;
  setSelectedDatasetId: (id: string) => void;
  selectedModel: string | undefined;
  setSelectedModel: (model: string) => void;
  selectedDeployment: "OPENAI" | "AZURE";
  setSelectedDeployment: (deployment: "OPENAI" | "AZURE") => void;
  selectedProviderKey: string | undefined;
  setSelectedProviderKey: (key: string) => void;
  useAzureForExperiment: boolean;
  PLAYGROUND_MODELS: PlaygroundModel[];
  setDecryptedKey: (key: string) => void;
  selectedPrompt: Prompt | undefined;

  setCurrentStep: (step: number) => void;
  refetchDataSets: () => void;
}

const ExperimentConfigSelector: React.FC<ExperimentConfigSelectorProps> = ({
  datasets,
  selectedDatasetId,
  setSelectedDatasetId,
  selectedModel,
  setSelectedModel,
  selectedDeployment,
  setSelectedDeployment,
  selectedProviderKey,
  setSelectedProviderKey,
  useAzureForExperiment,
  PLAYGROUND_MODELS,
  setDecryptedKey,
  selectedPrompt,
  setCurrentStep,
  refetchDataSets,
}) => {
  const [openConfirmModal, setOpenConfirmModal] = React.useState(false);
  const [requestIds, setRequestIds] = React.useState<any>();
  const jawn = useJawnClient();
  const { setNotification } = useNotification();

  return (
    <>
      <div className="flex flex-col">
        <div className="mt-2 flex flex-col h-full items-center justify-center">
          <div className="h-full w-full border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black">
            <div className="w-full flex justify-between items-center p-4 border-b border-gray-300 dark:border-gray-700 rounded-t-lg">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-500">New Config</p>
              </div>
            </div>
            <ul className="p-4 flex flex-col space-y-4">
              <li className="flex items-start space-x-2">
                <label className="text-sm text-black dark:text-white font-semibold w-28 pt-1">
                  Dataset
                </label>
                <div className="flex w-full max-w-lg space-x-2 items-center">
                  <Select
                    value={selectedDatasetId}
                    onValueChange={(value) => setSelectedDatasetId(value)}
                  >
                    {datasets.map((dataset) => (
                      <SelectItem key={dataset.id} value={dataset.id}>
                        {dataset.name}
                      </SelectItem>
                    ))}
                  </Select>
                  <Button
                    variant={"secondary"}
                    size={"xs"}
                    onClick={async () => {
                      const response = await jawn.POST(
                        "/v1/prompt/version/{promptVersionId}/inputs/query",
                        {
                          body: {
                            limit: 100,
                            random: true,
                          },
                          params: {
                            path: {
                              promptVersionId: selectedPrompt?.id ?? "",
                            },
                          },
                        }
                      );

                      setRequestIds(response.data?.data || undefined);
                      setOpenConfirmModal(true);
                    }}
                  >
                    Generate random dataset
                  </Button>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <label className="text-sm text-black dark:text-white font-semibold w-28 pt-1">
                  Model
                </label>
                <div className="flex w-full max-w-xs">
                  <Select
                    placeholder="Select a model"
                    value={selectedModel}
                    onValueChange={(value) => setSelectedModel(value)}
                  >
                    {PLAYGROUND_MODELS.map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </li>
              {useAzureForExperiment ? (
                <li className="flex items-start space-x-2">
                  <label className="text-sm text-black dark:text-white font-semibold w-28 pt-1">
                    Cloud Provider
                  </label>
                  <div className="flex w-full max-w-36">
                    <Select
                      placeholder="Select cloud"
                      value={selectedDeployment}
                      onValueChange={(value) => {
                        if (value === "AZURE" || value === "OPENAI")
                          setSelectedDeployment(value);
                      }}
                    >
                      <SelectItem value={"OPENAI"}>Open AI</SelectItem>
                      <SelectItem value={"AZURE"}>Azure</SelectItem>
                    </Select>
                  </div>
                </li>
              ) : (
                <li className="flex items-start space-x-2">
                  <label className="text-sm text-black dark:text-white font-semibold w-28 pt-1">
                    Provider Keys
                  </label>
                  <div className="flex w-full max-w-lg">
                    <ProviderKeyList
                      showTitle={false}
                      setDecryptedKey={setDecryptedKey}
                      setProviderKeyCallback={(providerKey) =>
                        setSelectedProviderKey(providerKey)
                      }
                    />
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
      <div
        id="step-inc"
        className="w-full flex justify-between sticky bottom-0 bg-gray-100 py-4 border-t border-gray-300 dark:border-gray-700 dark:bg-transparent"
      >
        <Button
          variant={"secondary"}
          size={"sm"}
          onClick={() => {
            setCurrentStep(1);
          }}
        >
          Back
        </Button>
        <Button
          variant={"default"}
          size={"sm"}
          title={"Continue"}
          onClick={() => {
            if (
              useAzureForExperiment &&
              (!selectedModel || !selectedDatasetId)
            ) {
              setNotification("Please select a model, and dataset.", "error");
              return;
            }
            if (
              !useAzureForExperiment &&
              (!selectedModel || !selectedDatasetId || !selectedProviderKey)
            ) {
              setNotification(
                "Please select a model, dataset, and provider key.",
                "error"
              );
              return;
            }
            setCurrentStep(3);
          }}
        />
      </div>
      <SelectRandomDataset
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        requestIds={requestIds}
        meta={{
          promptVersionId: selectedPrompt?.id,
        }}
        onSuccess={(datasetId) => {
          setSelectedDatasetId(datasetId ?? "");
          refetchDataSets();
        }}
      />
    </>
  );
};

export default ExperimentConfigSelector;
