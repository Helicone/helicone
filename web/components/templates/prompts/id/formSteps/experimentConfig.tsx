import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import ProviderKeyList from "../../../enterprise/portal/id/providerKeyList";
import PromptPropertyCard from "../promptPropertyCard";
import { useState } from "react";
import useNotification from "../../../../shared/notification/useNotification";
import { useOrg } from "../../../../layout/organizationContext";

interface ExperimentConfigProps {
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
  onFormSubmit: (data: {
    experimentName: string;
    version: number;
    model: string;
    providerKey: string;
    requestIds: string[];
  }) => void;
  initialValues?: {
    experimentName: string;
    version: number;
    model: string;
    providerKey: string;
    requestIds: string[];
  };
}

const ExperimentConfig = (props: ExperimentConfigProps) => {
  const { currentPrompt, promptProperties, onFormSubmit, initialValues } =
    props;

  const [selectedVersion, setSelectedVersion] = useState<string>(
    initialValues?.version.toString() || currentPrompt.latest_version.toString()
  );
  const [providerKeyId, setProviderKeyId] = useState(
    initialValues?.providerKey || ""
  );
  const [experimentName, setExperimentName] = useState(
    initialValues?.experimentName || ""
  );
  const [requestIdList, setRequestIdList] = useState<string[]>(
    initialValues?.requestIds || []
  );
  const [experimentModel, setExperimentModel] = useState<string>(
    initialValues?.model || "gpt-3.5-turbo-1106"
  );
  const { setNotification } = useNotification();
  const orgContext = useOrg();

  return (
    <div className="flex flex-col space-y-8 w-full">
      <div className="flex flex-col space-y-1 w-1/4">
        <label
          htmlFor="experiment-name"
          className="text-gray-900 dark:text-gray-100 text-xs font-semibold"
        >
          Name
        </label>
        <Input
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
            onValueChange={(e) => {
              setSelectedVersion(e);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={selectedVersion} />
            </SelectTrigger>
            <SelectContent>
              {Array.from(
                { length: currentPrompt.latest_version + 1 },
                (_, i) => i
              )
                .reverse()
                .map((version: any, i: number) => (
                  <SelectItem key={i} value={version.toString()}>
                    {version}
                  </SelectItem>
                ))}
            </SelectContent>
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
            onValueChange={(e) => {
              setExperimentModel(e);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-3.5-turbo-1106">
                gpt-3.5-turbo-1106
              </SelectItem>
              <SelectItem value="gpt-4-vision-preview">
                gpt-4-vision-preview
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ProviderKeyList
        orgId={orgContext?.currentOrg?.id}
        setProviderKeyCallback={(x) => {
          setProviderKeyId(x);
        }}
        variant="basic"
      />
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
              key={`prompt-${i}`}
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
                autoInputs={[]}
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

            onFormSubmit({
              experimentName,
              version: parseInt(selectedVersion || "0"),
              model: experimentModel,
              providerKey: providerKeyId,
              requestIds: requestIdList,
            });
          }}
          className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ExperimentConfig;
