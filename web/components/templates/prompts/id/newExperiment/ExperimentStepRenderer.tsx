import React, { useEffect, useState } from "react";
import { playgroundModels } from "../../../../../packages/cost/providers/mappings";
import { useGetDataSets } from "../../../../../services/hooks/prompts/datasets";
import ChatPlayground from "../../../playground/chatPlayground";
import ExperimentConfigSelector from "./ExperimentConfigSelector";
import ExperimentConfirmation from "./ExperimentConfirmation";
import { MessageWithoutId } from "./promptNewExperiment";
import PromptVersionSelector from "./PromptVersionSelector";
import { Prompt } from "./types";
import {
  PlaygroundModel,
  fetchFineTuneModels,
} from "../../../playground/playgroundPage";

const PLAYGROUND_MODELS = playgroundModels
  .filter((model) => model.provider !== "AZURE")
  .sort((a, b) => a.name.localeCompare(b.name));

interface ExperimentStepRendererProps {
  currentStep: number;
  prompts: Prompt[];
  selectedPrompt: Prompt | undefined;
  setSelectedPrompt: (prompt: Prompt | undefined) => void;
  setCurrentStep: (step: number) => void;
  useAzureForExperiment: boolean;
  id: string;
}

export interface Model {
  name: string;
  provider: string;
}

const ExperimentStepRenderer: React.FC<ExperimentStepRendererProps> = ({
  currentStep,
  prompts,
  selectedPrompt,
  setSelectedPrompt,
  setCurrentStep,
  useAzureForExperiment,
  id,
}) => {
  const [selectedModel, setSelectedModel] = useState<string>();
  const [selectedDeployment, setSelectedDeployment] = useState<
    "OPENAI" | "AZURE"
  >("OPENAI");
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>();
  const [currentChat, setCurrentChat] = useState<MessageWithoutId[]>();
  const [selectedProviderKey, setSelectedProviderKey] = useState<string>();

  const template = JSON.parse(
    JSON.stringify(selectedPrompt?.helicone_template ?? "")
  ).messages;

  const { datasets: datasets, refetch: refetchDataSets } = useGetDataSets(
    selectedPrompt?.id
  );

  const selectedDataset = datasets.find(
    (dataset) => dataset.id === selectedDatasetId
  );

  const [decryptedKey, setDecryptedKey] = useState("");
  const [playgroundModels, setPlaygroundModels] = useState<PlaygroundModel[]>(
    PLAYGROUND_MODELS.filter((model) => model.provider == "OPENAI")
  );

  useEffect(() => {
    fetchFineTuneModels(decryptedKey, setPlaygroundModels);
  }, [decryptedKey]);

  useEffect(() => {
    if (selectedPrompt?.model) {
      setSelectedModel(selectedPrompt.model);
    }
  }, [selectedPrompt]);

  switch (currentStep) {
    case 0:
      return (
        <PromptVersionSelector
          prompts={prompts}
          selectedPrompt={selectedPrompt}
          setSelectedPrompt={setSelectedPrompt}
          onContinue={() => setCurrentStep(1)}
        />
      );
    case 1:
      return (
        <>
          <ChatPlayground
            requestId={""}
            chat={template}
            models={[]}
            temperature={0.5}
            maxTokens={256}
            submitText={"Save Changes"}
            onSubmit={(chat) => {
              const cleanedChat = chat.map((msg) => {
                if (typeof msg === "string") {
                  return msg;
                }
                const { id, ...rest } = msg;
                return rest;
              });
              setCurrentChat(cleanedChat);
            }}
            customNavBar={{
              onBack: () => setCurrentStep(0),
              onContinue: () => setCurrentStep(2),
            }}
          />
        </>
      );
    case 2:
      return (
        <ExperimentConfigSelector
          key={2}
          datasets={datasets}
          selectedDatasetId={selectedDatasetId}
          setSelectedDatasetId={setSelectedDatasetId}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          selectedDeployment={selectedDeployment}
          setSelectedDeployment={setSelectedDeployment}
          selectedProviderKey={selectedProviderKey}
          setSelectedProviderKey={setSelectedProviderKey}
          useAzureForExperiment={useAzureForExperiment}
          PLAYGROUND_MODELS={playgroundModels}
          setDecryptedKey={setDecryptedKey}
          selectedPrompt={selectedPrompt}
          setCurrentStep={setCurrentStep}
          refetchDataSets={refetchDataSets}
        />
      );
    case 3:
      return (
        <ExperimentConfirmation
          key={3}
          template={template}
          currentChat={currentChat ?? []}
          selectedDataset={selectedDataset}
          selectedModel={selectedModel}
          selectedProviderKey={selectedProviderKey}
          selectedDatasetId={selectedDatasetId}
          selectedDeployment={selectedDeployment}
          useAzureForExperiment={useAzureForExperiment}
          selectedPrompt={selectedPrompt}
          setCurrentStep={setCurrentStep}
          id={id}
        />
      );
    default:
      return <div>Unknown step</div>;
  }
};

export default ExperimentStepRenderer;
