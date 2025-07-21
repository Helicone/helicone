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
import { useOrg } from "../../../../layout/org/organizationContext";

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
    initialValues?.version.toString() ||
      currentPrompt.latest_version.toString(),
  );
  const [providerKeyId, setProviderKeyId] = useState(
    initialValues?.providerKey || "",
  );
  const [experimentName, setExperimentName] = useState(
    initialValues?.experimentName || "",
  );
  const [requestIdList, setRequestIdList] = useState<string[]>(
    initialValues?.requestIds || [],
  );
  const [experimentModel, setExperimentModel] = useState<string>(
    initialValues?.model || "gpt-3.5-turbo-1106",
  );
  const { setNotification } = useNotification();
  const orgContext = useOrg();

  return (
    <div className="flex w-full flex-col space-y-8">
      <div className="flex w-1/4 flex-col space-y-1">
        <label
          htmlFor="experiment-name"
          className="text-xs font-semibold text-gray-900 dark:text-gray-100"
        >
          Name
        </label>
        <Input
          value={experimentName}
          onChange={(e) => setExperimentName(e.target.value)}
        />
      </div>
      <div className="flex w-full gap-4">
        <div className="flex w-1/4 flex-col space-y-1">
          <label
            htmlFor="alert-metric"
            className="text-xs font-semibold text-gray-900 dark:text-gray-100"
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
                (_, i) => i,
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
        <div className="flex w-1/4 flex-col space-y-1">
          <label
            htmlFor="experiment-model"
            className="text-xs font-semibold text-gray-900 dark:text-gray-100"
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
      <div className="flex w-full flex-col space-y-1 pt-8">
        <label
          htmlFor="experiment-sample"
          className="text-xs font-semibold text-gray-900 dark:text-gray-100"
        >
          Random Data Set Sample (up to 10)
        </label>
        <div className="flex w-full gap-4 overflow-auto">
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
      <div className="flex items-center justify-end space-x-2 border-t border-gray-300 py-4">
        <button
          onClick={close}
          className="flex flex-row items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:border-gray-700 dark:bg-black dark:text-gray-100 dark:hover:bg-gray-900 dark:hover:text-gray-300"
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
              promptProperties.map((property) => property.id).slice(0, 10),
            );

            onFormSubmit({
              experimentName,
              version: parseInt(selectedVersion || "0"),
              model: experimentModel,
              providerKey: providerKeyId,
              requestIds: requestIdList,
            });
          }}
          className="flex items-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ExperimentConfig;
