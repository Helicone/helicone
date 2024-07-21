import { useState } from "react";
import {
  usePrompt,
  usePromptVersions,
} from "../../../../../services/hooks/prompts/prompts";

import { useJawnSettings } from "../../../../../services/hooks/useJawnSettings";

import { Message } from "../../../requests/chatComponent/types";
import ExperimentHeader from "./ExperimentHeader";
import ExperimentStepRenderer from "./ExperimentStepRenderer";
import { Prompt } from "./types";

interface PromptIdPageProps {
  id: string;
}

// omit id from Message
export type MessageWithoutId = Omit<Message, "id">;

const PromptNewExperimentPage = (props: PromptIdPageProps) => {
  const { id } = props;
  const [currentStep, setCurrentStep] = useState(0);
  const { prompt } = usePrompt(id);

  const [selectedPrompt, setSelectedPrompt] = useState<Prompt>();

  const { prompts } = usePromptVersions(id);
  const jawnSettings = useJawnSettings();

  return (
    <>
      <div className="w-full h-full flex flex-col space-y-4 relative">
        <ExperimentHeader
          id={id}
          promptName={prompt?.user_defined_id}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          selectedPrompt={selectedPrompt}
        />
        <ExperimentStepRenderer
          currentStep={currentStep}
          prompts={prompts!}
          selectedPrompt={selectedPrompt}
          setSelectedPrompt={setSelectedPrompt}
          setCurrentStep={setCurrentStep}
          useAzureForExperiment={
            jawnSettings.data?.data?.useAzureForExperiment ?? false
          }
          id={id}
        />
      </div>
    </>
  );
};

export default PromptNewExperimentPage;
