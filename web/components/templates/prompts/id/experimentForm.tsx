import { useState } from "react";
import { usePlaygroundPage } from "../../../../services/hooks/playground";
import ChatPlayground from "../../playground/chatPlayground";
import FormSteps from "./formSteps";
import { BeakerIcon } from "@heroicons/react/24/solid";
import { Select, SelectItem, TextInput } from "@tremor/react";
import ProviderKeyList from "../../enterprise/portal/id/providerKeyList";
import { useOrg } from "../../../layout/organizationContext";
import PromptPropertyCard from "./promptPropertyCard";
import useNotification from "../../../shared/notification/useNotification";
import ExperimentConfig from "./formSteps/experimentConfig";

interface ExperimentFormProps {
  requestId: string;
  currentPrompt: {
    id: string;
    latest_version: number;
    created_at: string;
  };
  promptProperties: {
    id: string;
    createdAt: string;
    properties: Record<string, string>;
    response: string;
  }[];
  close: () => void;
}

const ExperimentForm = (props: ExperimentFormProps) => {
  const { requestId, currentPrompt, promptProperties, close } = props;

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<{
    experimentName: string;
    version: number;
    model: string;
    providerKey: string;
    requestIds: string[];
  }>();

  const { data, isLoading, chat, hasData, isChat } =
    usePlaygroundPage(requestId);

  const singleRequest = data.length > 0 ? data[0] : null;

  const renderStep = [
    <ExperimentConfig
      key={0}
      currentPrompt={currentPrompt}
      promptProperties={promptProperties}
      initialValues={formData}
      onFormSubmit={(data) => {
        setFormData(data);
        setCurrentStep(1);
      }}
    />,
    <div>
      {isLoading ? (
        <h1>loading...</h1>
      ) : hasData && isChat && singleRequest !== null ? (
        <>
          <ChatPlayground
            requestId={""}
            chat={chat}
            models={["gpt-3.5-turbo"]}
            temperature={1}
            maxTokens={256}
          />
        </>
      ) : (
        <h1>
          {JSON.stringify(chat)}
          {JSON.stringify(data)}no data
        </h1>
      )}
    </div>,
    <h1>Step 3</h1>,
  ];

  return (
    <div className="w-full flex flex-col space-y-4 pb-4 relative h-full justify-between">
      <header className="sticky top-[4.25rem] z-40 bg-white border-b border-gray-300 flex flex-col space-y-8 pb-4">
        <div className="flex items-center space-x-2">
          <BeakerIcon className="h-8 w-8 text-sky-500" />
          <h2 className="font-semibold text-black dark:text-white text-2xl">
            New Experiment
          </h2>
        </div>

        <FormSteps
          currentStep={currentStep}
          setCurrentStep={(id) => {
            setCurrentStep(id);
          }}
        />
      </header>
      <div className="flex-1">{renderStep[currentStep]}</div>

      {/* <div className="w-full bg-red-500 sticky bottom-0 z-50 h-10"></div> */}
    </div>
  );
};

export default ExperimentForm;
