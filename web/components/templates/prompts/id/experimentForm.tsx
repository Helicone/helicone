import { useState } from "react";
import {
  getChat,
  usePlaygroundPage,
} from "../../../../services/hooks/playground";
import ChatPlayground from "../../playground/chatPlayground";
import PlaygroundPage from "../../playground/playgroundPage";
import { Message } from "../../requests/chat";
import FormSteps from "./formSteps";
import { set } from "date-fns";
import { BeakerIcon } from "@heroicons/react/24/solid";
import { Select, SelectItem } from "@tremor/react";
import ProviderKeyList from "../../enterprise/portal/id/providerKeyList";
import { useOrg } from "../../../layout/organizationContext";

interface ExperimentFormProps {
  requestId: string;
  currentPrompt: {
    id: string;
    latest_version: number;
    created_at: string;
  };
}

const ExperimentForm = (props: ExperimentFormProps) => {
  const { requestId, currentPrompt } = props;

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedVersion, setSelectedVersion] = useState<string>();
  const [providerKeyId, setProviderKeyId] = useState("");

  const { data, isLoading, chat, hasData, isChat } =
    usePlaygroundPage(requestId);
  const orgContext = useOrg();

  const singleRequest = data.length > 0 ? data[0] : null;

  const renderStep = [
    <div>
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-1">
          <label
            htmlFor="alert-metric"
            className="text-gray-900 dark:text-gray-100 text-xs font-semibold"
          >
            Version
          </label>
          <Select
            value={selectedVersion}
            placeholder={selectedVersion}
            onValueChange={(e) => {
              setSelectedVersion(e);
            }}
            enableClear={false}
            style={{ width: "2rem" }}
          >
            {Array.from(
              { length: currentPrompt.latest_version + 1 },
              (_, i) => i
            )
              .reverse()
              .map((version: any, i: number) => (
                <SelectItem value={version} key={i}>
                  {version}
                </SelectItem>
              ))}
          </Select>
        </div>
        <div className="flex flex-col space-y-1">
          <label
            htmlFor="alert-metric"
            className="text-gray-900 dark:text-gray-100 text-xs font-semibold"
          >
            Version
          </label>
          <Select
            value={selectedVersion}
            placeholder={selectedVersion}
            onValueChange={(e) => {
              setSelectedVersion(e);
            }}
            enableClear={false}
            style={{ width: "2rem" }}
          >
            {Array.from(
              { length: currentPrompt.latest_version + 1 },
              (_, i) => i
            )
              .reverse()
              .map((version: any, i: number) => (
                <SelectItem value={version} key={i}>
                  {version}
                </SelectItem>
              ))}
          </Select>
        </div>
        <ProviderKeyList
          orgId={orgContext?.currentOrg?.id}
          setProviderKeyCallback={(x) => {
            setProviderKeyId(x);
          }}
          variant="basic"
        />
      </div>
    </div>,
    <h1>Step 2</h1>,
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

      {/* {isLoading ? (
        <h1>loading...</h1>
      ) : hasData && isChat && singleRequest !== null ? (
        <ChatPlayground
          requestId={requestId}
          chat={chat}
          models={["gpt-3.5-turbo"]}
          temperature={1}
          maxTokens={256}
        />
      ) : (
        <h1>
          {" "}
          {JSON.stringify(chat)}
          {JSON.stringify(data)}no data
        </h1>
      )} */}
    </div>
  );
};

export default ExperimentForm;
