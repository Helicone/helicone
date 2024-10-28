import React from "react";
import { Button } from "../../../../ui/button";

import { useJawnClient } from "../../../../../lib/clients/jawnHook";
import useNotification from "../../../../shared/notification/useNotification";
import { useRouter } from "next/router";
import ArrayDiffViewer from "../arrayDiffViewer";
import ModelPill from "../../../requestsV2/modelPill";

interface ExperimentConfirmationProps {
  template: any[]; // Replace with the correct type
  currentChat: any[] | null; // Replace with the correct type
  selectedDataset: { name: string } | undefined;
  selectedModel: string | undefined;
  selectedProviderKey: string | undefined;
  selectedDatasetId: string | undefined;
  selectedDeployment: "OPENAI" | "AZURE";
  useAzureForExperiment: boolean;
  selectedPrompt: { id: string } | undefined;
  setCurrentStep: (step: number) => void;
  id: string; // The ID for routing
}

const ExperimentConfirmation: React.FC<ExperimentConfirmationProps> = ({
  template,
  currentChat,
  selectedDataset,
  selectedModel,
  selectedProviderKey,
  selectedDatasetId,
  selectedDeployment,
  useAzureForExperiment,
  selectedPrompt,
  setCurrentStep,
  id,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const jawn = useJawnClient();
  const { setNotification } = useNotification();
  const router = useRouter();

  const handleConfirmExperiment = async () => {
    if (useAzureForExperiment && (!selectedModel || !selectedDatasetId)) {
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
    setIsLoading(true);

    try {
      // creates a new subversion of the prompt
      const newSubVersion = await jawn.POST(
        "/v1/prompt/version/{promptVersionId}/subversion",
        {
          body: {
            newHeliconeTemplate: {
              model: selectedModel,
              messages: currentChat,
            },
          },
          params: {
            path: {
              promptVersionId: selectedPrompt?.id!,
            },
          },
        }
      );

      if (newSubVersion.data?.error) {
        throw new Error("Error creating subversion");
      }

      // runs the experiment with the new dataset and new subversion
      const res = await jawn.POST("/v1/experiment", {
        body: {
          datasetId: selectedDatasetId!,
          model: selectedModel!,
          promptVersion: newSubVersion.data?.data?.id!,
          providerKeyId: useAzureForExperiment ? "NOKEY" : selectedProviderKey!,
          meta: {
            deployment: selectedDeployment,
          },
        },
      });

      if (res.data?.error) {
        throw new Error("Error running experiment");
      }

      setNotification(
        "Experiment started successfully. Redirecting you to the prompt page",
        "success"
      );
      // reroute the user after 2 seconds
      setTimeout(() => {
        router.push(`/prompts/${id}`);
      }, 2000);
    } catch (error) {
      setNotification("Error running experiment. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col space-y-8 text-black dark:text-white">
        <div className="h-full w-full border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black">
          <div className="w-full flex justify-between items-center p-4 border-b border-gray-300 dark:border-gray-700 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-500">Diff Viewer</p>
            </div>
          </div>
          <div className="p-4">
            <ArrayDiffViewer origin={template} target={currentChat || []} />
          </div>
        </div>

        <div className="mt-2 flex flex-col h-full items-center justify-center">
          <div className="h-full w-full border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black">
            <div className="w-full flex justify-between items-center p-4 border-b border-gray-300 dark:border-gray-700 rounded-t-lg">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-500">
                  Experiment Configuration
                </p>
              </div>
            </div>
            <ul className="p-4 flex flex-col space-y-4">
              <li className="flex items-center space-x-2">
                <label className="text-sm text-black dark:text-white font-semibold w-28">
                  Dataset
                </label>
                <p className="flex w-full max-w-lg space-x-2 items-center text-sm">
                  {selectedDataset?.name}
                </p>
              </li>
              <li className="flex items-center space-x-2">
                <label className="text-sm text-black dark:text-white font-semibold w-28">
                  Model
                </label>
                <div className="flex w-full max-w-xs">
                  <ModelPill model={selectedModel || "unselected"} />
                </div>
              </li>

              <li className="flex items-center space-x-2">
                <label className="text-sm text-black dark:text-white font-semibold w-28 pt-1">
                  Provider Key
                </label>
                <div className="flex w-full max-w-lg">
                  <input
                    type="password"
                    value={selectedProviderKey}
                    className="border-none focus:ring-0 focus:outline-none w-full py-0 bg-white dark:bg-black"
                    disabled
                  />
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div
        id="step-inc"
        className="w-full flex justify-between sticky bottom-0 bg-gray-100 py-4 border-t border-gray-300 dark:border-gray-700 dark:bg-transparent"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setCurrentStep(2);
          }}
        >
          Back
        </Button>
        <Button
          disabled={isLoading}
          size="sm"
          onClick={handleConfirmExperiment}
        >
          Confirm and run experiment
        </Button>
      </div>
    </>
  );
};

export default ExperimentConfirmation;
