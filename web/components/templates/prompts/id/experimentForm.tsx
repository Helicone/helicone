import { ArrowPathIcon, BeakerIcon } from "@heroicons/react/24/solid";
import { Select, SelectItem, TextInput } from "@tremor/react";
import { useState } from "react";
import { usePlaygroundPage } from "../../../../services/hooks/playground";
import { useOrg } from "../../../layout/organizationContext";
import useNotification from "../../../shared/notification/useNotification";
import ProviderKeyList from "../../enterprise/portal/id/providerKeyList";
import { Message } from "../../requests/chat";
import FormSteps from "./formSteps";
import EditPrompt from "./formSteps/editPrompt";
import PromptPropertyCard from "./promptPropertyCard";

interface ExperimentFormProps {
  currentPrompt: {
    id: string;
    latest_version: number;
    created_at: string;
  };
  heliconeTemplate: any;
  promptProperties: {
    id: string;
    createdAt: string;
    properties: Record<string, string>;
    response: string;
  }[];
  close: () => void;
}

const ExperimentForm = (props: ExperimentFormProps) => {
  const { currentPrompt, heliconeTemplate, promptProperties, close } = props;

  // make a deep copy of the heliconeTemplate
  const originPromptCopy = JSON.parse(JSON.stringify(heliconeTemplate));

  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedVersion, setSelectedVersion] = useState<string>();
  const [providerKeyId, setProviderKeyId] = useState("");
  const [experimentName, setExperimentName] = useState("");
  const [requestIdList, setRequestIdList] = useState<string[]>([]);
  const [newPromptChat, setNewPromptChat] = useState<Message[]>([]);
  const [experimentModel, setExperimentModel] =
    useState<string>("gpt-3.5-turbo-1106");

  const { setNotification } = useNotification();

  const requestId = promptProperties?.[0]?.id || "";

  const {
    data,
    isLoading: isDataLoading,
    chat,
    hasData,
    isChat,
  } = usePlaygroundPage(requestId);
  const orgContext = useOrg();

  const singleRequest = data.length > 0 ? data[0] : null;

  const renderStep = [
    <div className="flex flex-col space-y-8 w-full" key={1}>
      <div className="flex flex-col space-y-1 w-1/4">
        <label
          htmlFor="experiment-name"
          className="text-gray-900 dark:text-gray-100 text-xs font-semibold"
        >
          Name
        </label>
        <TextInput
          value={experimentName}
          onChange={(e) => setExperimentName(e.target.value)}
        />
      </div>
      <div className="flex w-full gap-4">
        <div className="flex flex-col space-y-1 w-1/4">
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
            className="w-full"
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
        <div className="flex flex-col space-y-1 w-1/4">
          <label
            htmlFor="experiment-model"
            className="text-gray-900 dark:text-gray-100 text-xs font-semibold"
          >
            Experiment Model
          </label>
          <Select
            value={experimentModel}
            enableClear={false}
            onValueChange={(e) => {
              setExperimentModel(e);
            }}
          >
            <SelectItem value="gpt-3.5-turbo-1106">
              gpt-3.5-turbo-1106
            </SelectItem>
            <SelectItem value="gpt-4-vision-preview">
              gpt-4-vision-preview
            </SelectItem>
          </Select>
        </div>
      </div>
      <div className="w-1/2">
        <ProviderKeyList
          orgId={orgContext?.currentOrg?.id}
          setProviderKeyCallback={(x) => {
            setProviderKeyId(x);
          }}
          variant="basic"
        />
      </div>

      <div className="flex flex-col space-y-1 w-full pt-8">
        <label
          htmlFor="experiment-sample"
          className="text-gray-900 dark:text-gray-100 text-xs font-semibold"
        >
          Random Data Set Sample (up to 10)
        </label>
        <div className="flex w-full overflow-auto gap-4">
          {/* get a random `n=10` sample of the properties and then render cards */}
          {[...promptProperties].slice(0, 10).map((property, i) => (
            <div
              className="w-full min-w-[25rem] max-w-[25rem]"
              key={`property-${i}`}
            >
              <PromptPropertyCard
                key={i}
                isSelected={false}
                onSelect={() => {}}
                requestId={property.id}
                createdAt={property.createdAt}
                properties={property.properties}
                size="small"
                index={i + 1}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-gray-300 py-4 flex items-center justify-end space-x-2">
        <button
          onClick={close}
          className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (experimentName === "") {
              setNotification("Experiment name is required", "error");
              return;
            }
            if (selectedVersion === "") {
              setNotification("Version is required", "error");
              return;
            }
            if (providerKeyId === "") {
              setNotification("Provider key is required", "error");
              return;
            }
            // set the request id list
            setRequestIdList(
              promptProperties.map((property) => property.id).slice(0, 10)
            );
            setCurrentStep(1);
          }}
          className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Next
        </button>
      </div>
    </div>,
    <div key={2}>
      {isDataLoading ? (
        <h1>loading...</h1>
      ) : hasData && isChat && singleRequest !== null ? (
        <EditPrompt
          heliconeTemplate={originPromptCopy}
          onSubmit={(newPrompt) => {
            setNewPromptChat(newPrompt);
            setCurrentStep(2);
          }}
        />
      ) : (
        <div className="flex flex-col">No data available.</div>
      )}
    </div>,
    <div key={3} className="flex flex-col space-y-4">
      <h3 className="font-semibold text-2xl">Confirm your experiment run</h3>
      <ul className="flex flex-col space-y-2">
        <li className="flex items-center gap-1">
          <h4 className="font-semibold">Experiment Name</h4>-
          <p>{experimentName}</p>
        </li>
        <li className="flex items-center gap-1">
          <h4 className="font-semibold">Version</h4>-<p>{selectedVersion}</p>
        </li>

        <li className="flex items-center gap-1">
          <h4 className="font-semibold">Experiment Model</h4>-
          <p>{experimentModel}</p>
        </li>
      </ul>
      <p>
        This experiment will make{" "}
        {requestId.length < 10 ? requestId.length : 10} request(s) to OpenAI.
        Please confirm and the experiment will start.{" "}
      </p>
      <div className="border-t border-gray-300 py-4 flex items-center justify-end space-x-2">
        <button
          onClick={close}
          className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            setIsLoading(true);
            fetch(`/api/experiment/create`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: experimentName,
                providerKeyId: providerKeyId,
                originPrompt: {
                  promptId: currentPrompt.id,
                  version: selectedVersion,
                },
                newPrompt: {
                  heliconeTemplate: {
                    model: experimentModel,
                    messages: newPromptChat,
                  },
                },
                dataset: {
                  requestIds: requestIdList.slice(0, 10),
                },
              }),
            })
              .then((res) => res.json())
              .then((res) => {
                if (res.error) {
                  setNotification(res.error, "error");
                  close();
                  return;
                } else {
                  setNotification("Experiment has been created", "success");
                  close();
                }
              })
              .finally(() => {
                setIsLoading(false);
              });
          }}
          className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {isLoading && (
            <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
          )}
          Confirm and Run Experiment
        </button>
      </div>
    </div>,
  ];

  return (
    <div className="w-full flex flex-col space-y-8 pb-4 relative h-full justify-between">
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
