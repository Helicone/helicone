import React from "react";
import HcBreadcrumb from "../../../../ui/hcBreadcrumb";
import StepActions from "../../../../shared/stepActions";
import { Prompt } from "./types";

interface ExperimentHeaderProps {
  id: string;
  promptName: string | undefined;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  selectedPrompt: Prompt | undefined;
}

const ExperimentHeader: React.FC<ExperimentHeaderProps> = ({
  id,
  promptName,
  currentStep,
  setCurrentStep,
  selectedPrompt,
}) => {
  return (
    <>
      <div className="flex flex-col items-start w-full">
        <HcBreadcrumb
          pages={[
            {
              href: "/prompts",
              name: "Prompts",
            },
            {
              href: `/prompts/${id}`,
              name: promptName || "Loading...",
            },
            {
              href: `/prompts/${id}/new-experiment`,
              name: "New Experiment",
            },
          ]}
        />
        <h1 className="font-semibold text-4xl text-black dark:text-white pt-8">
          Experiment
        </h1>
        <p className="text-sm text-gray-500 pt-2">
          Test your prompt with different configurations.
        </p>
      </div>
      <StepActions
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        steps={[
          {
            id: 0,
            name: "Choose Prompt",
            description: selectedPrompt
              ? `V${selectedPrompt.major_version}.${selectedPrompt.minor_version}`
              : undefined,
          },
          {
            id: 1,
            name: "Edit Prompt",
          },
          {
            id: 2,
            name: "Select Model and Dataset",
          },
          {
            id: 3,
            name: "Confirm",
          },
        ]}
        allowStepSelection={false}
      />
    </>
  );
};

export default ExperimentHeader;
