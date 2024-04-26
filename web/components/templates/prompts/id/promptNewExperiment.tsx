import { useState } from "react";
import {
  usePrompt,
  usePromptVersions,
} from "../../../../services/hooks/prompts/prompts";

import { useJawnClient } from "../../../../lib/clients/jawnHook";
import HcBreadcrumb from "../../../ui/hcBreadcrumb";
import StepActions from "../../../shared/stepActions";
import HcButton from "../../../ui/hcButton";
import { Select, SelectItem } from "@tremor/react";
import HcBadge from "../../../ui/hcBadge";
import { clsx } from "../../../shared/clsx";
import ChatPlayground from "../../playground/chatPlayground";
import { PLAYGROUND_MODELS } from "../../playground/playgroundPage";
import ProviderKeyList from "../../enterprise/portal/id/providerKeyList";
import { PlusIcon } from "@heroicons/react/20/solid";
import { Message } from "../../requests/chat";
import ReactDiffViewer from "react-diff-viewer";
import ModelPill from "../../requestsV2/modelPill";
import SelectRandomDataset from "./selectRandomDataset";
import useNotification from "../../../shared/notification/useNotification";
import { useRouter } from "next/router";
import MarkdownEditor from "../../../shared/markdownEditor";
import { ArrowsPointingOutIcon } from "@heroicons/react/24/outline";
import ThemedModal from "../../../shared/themed/themedModal";
import { Tooltip } from "@mui/material";
import { useGetDataSets } from "../../../../services/hooks/prompts/datasets";
import { useJawnSettings } from "../../../../services/hooks/useJawnSettings";

interface PromptIdPageProps {
  id: string;
}

const PromptNewExperimentPage = (props: PromptIdPageProps) => {
  const { id } = props;
  const { prompt } = usePrompt(id);
  const { prompts } = usePromptVersions(id);
  const router = useRouter();
  const jawn = useJawnClient();

  const jawnSettings = useJawnSettings();

  const { setNotification } = useNotification();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState<{
    id: string;
    minor_version: number;
    major_version: number;
    helicone_template: string;
    prompt_v2: string;
    model: string;
  }>();
  const [selectedModel, setSelectedModel] = useState<string>();
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>();
  const [currentChat, setCurrentChat] = useState<Message[]>();
  const [selectedProviderKey, setSelectedProviderKey] = useState<string>();
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [requestIds, setRequestIds] = useState<
    {
      id: string;
      inputs: {
        [key: string]: string;
      };
      source_request: string;
      prompt_version: string;
      created_at: string;
    }[]
  >();
  const [searchVersion, setSearchVersion] = useState<string>();
  const [open, setOpen] = useState(false);
  const [selectedVersionTemplate, setSelectedVersionTemplate] = useState("");

  const template = JSON.parse(
    JSON.stringify(selectedPrompt?.helicone_template ?? "")
  ).messages;

  const sortedPrompts = prompts?.sort(
    (a, b) =>
      b.major_version - a.major_version || b.minor_version - a.minor_version
  );

  // find the most major version. major versions have a 0 minor version
  const latestMajorVersion = sortedPrompts?.find(
    (prompt) => prompt.minor_version === 0
  );

  // find the latest version, which is the first element in the sorted array
  const latestVersion = sortedPrompts?.[0];

  // const [datasets, setDatasets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    datasets: datasets,
    isLoading: isDataSetsLoading,
    refetch: refetchDataSets,
  } = useGetDataSets();

  const selectedDataset = datasets.find(
    (dataset) => dataset.id === selectedDatasetId
  );

  const renderStepArray = [
    <>
      <div className="mt-2 flex flex-col h-full items-center justify-center">
        <div className="h-full w-full border border-gray-300 dark:border-gray-700 rounded-lg bg-white">
          <div className="w-full flex justify-between items-center py-2 px-4 border-b border-gray-300 dark:border-gray-700 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-500">Version:</label>
              <Select
                value={searchVersion}
                onValueChange={(value) => setSearchVersion(value)}
                enableClear={true}
              >
                {prompts?.map((prompt) => (
                  <SelectItem
                    key={prompt.id}
                    value={`${prompt.major_version}.${prompt.minor_version}`}
                  >
                    {prompt.major_version}.{prompt.minor_version}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>

          <ul className="divide-y divide-gray-300 dark:divide-gray-700">
            {sortedPrompts
              ?.filter((prompt) => {
                if (!searchVersion) {
                  return true;
                }
                return (
                  // filter by major version and minor version
                  `${prompt.major_version}.${prompt.minor_version}` ===
                  searchVersion
                );
              })
              .map((prompt, index) => {
                const template = JSON.parse(
                  JSON.stringify(prompt.helicone_template)
                ).messages[0].content;
                return (
                  <>
                    <li
                      key={prompt.id}
                      className={clsx(
                        index === sortedPrompts.length - 1
                          ? "rounded-b-lg"
                          : "",
                        selectedPrompt?.id === prompt.id
                          ? "bg-sky-50"
                          : "bg-white",
                        "flex items-start space-x-2 gap-2  p-6"
                      )}
                    >
                      <input
                        type="radio"
                        name="selected-prompt"
                        className="border border-gray-300 dark:border-gray-700 rounded-full p-2.5 hover:cursor-pointer"
                        checked={selectedPrompt?.id === prompt.id}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          if (isChecked) {
                            setSelectedPrompt(prompt);
                          } else {
                            setSelectedPrompt(undefined);
                          }
                        }}
                      />
                      <div className="flex flex-col space-y-1 w-1/4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">
                            V{prompt.major_version}.{prompt.minor_version}
                          </span>
                          {latestMajorVersion?.major_version ===
                            prompt.major_version &&
                            prompt.minor_version === 0 && (
                              <HcBadge title={"Production"} size={"sm"} />
                            )}
                        </div>
                        {/* TODO: add the version created at */}
                        {/* <div className="text-sm text-gray-500">
                        created on {prompt.}
                      </div> */}
                      </div>
                      <div className="relative w-full">
                        <MarkdownEditor
                          text={
                            template.length > 200
                              ? `${template.substring(0, 200)}...`
                              : template
                          }
                          setText={() => {}}
                          disabled={true}
                        />
                        {template.length > 200 && (
                          <Tooltip title="Expand">
                            <button
                              onClick={() => {
                                setSelectedVersionTemplate(template);
                                setOpen(true);
                              }}
                              className="absolute top-4 right-4"
                            >
                              <ArrowsPointingOutIcon className="h-4 w-4 text-gray-500" />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </li>
                  </>
                );
              })}
          </ul>
        </div>
      </div>
      <div
        id="step-inc"
        className="w-full flex justify-end sticky bottom-0 bg-gray-100 py-4 border-t border-gray-300 dark:border-gray-700 dark:bg-gray-900"
      >
        <HcButton
          variant={"primary"}
          size={"sm"}
          title={"Continue"}
          onClick={() => {
            if (!selectedPrompt) {
              setNotification(
                "Please select a version to run the experiment.",
                "error"
              );
              return;
            } else {
              setCurrentStep(1);
            }
          }}
        />
      </div>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="flex flex-col w-[80vw]">
          <MarkdownEditor
            text={selectedVersionTemplate}
            setText={() => {}}
            disabled={true}
          />
        </div>
      </ThemedModal>
    </>,
    <>
      <ChatPlayground
        requestId={""}
        chat={currentChat || template}
        models={[]}
        temperature={0.5}
        maxTokens={256}
        submitText={"Save Changes"}
        onSubmit={(chat) => {
          setCurrentChat(chat);
        }}
        customNavBar={{
          onBack: () => {
            setCurrentStep(0);
          },
          onContinue: () => {
            setCurrentStep(2);
          },
          // check if the current chat is equal to the template
        }}
      />
    </>,
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
                  Dataset {datasets.length}
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
                  <HcButton
                    variant={"secondary"}
                    size={"xs"}
                    title={"Generate random dataset"}
                    icon={PlusIcon}
                    onClick={async () => {
                      const requestIds = await jawn.POST(
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

                      requestIds.data?.data;

                      setRequestIds(requestIds.data?.data || undefined);
                      setOpenConfirmModal(true);
                    }}
                  />
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
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </li>
              {!!jawnSettings.data?.data?.useAzureForExperiment || (
                <li className="flex items-start space-x-2">
                  <label className="text-sm text-black dark:text-white font-semibold w-28 pt-1">
                    Provider Keys
                  </label>
                  <div className="flex w-full max-w-lg">
                    <ProviderKeyList
                      showTitle={false}
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
        className="w-full flex justify-between sticky bottom-0 bg-gray-100 py-4 border-t border-gray-300 dark:border-gray-700 dark:bg-gray-900"
      >
        <HcButton
          variant={"secondary"}
          size={"sm"}
          title={"Back"}
          onClick={() => {
            setCurrentStep(1);
          }}
        />
        <HcButton
          variant={"primary"}
          size={"sm"}
          title={"Continue"}
          onClick={() => {
            if (
              jawnSettings.data?.data?.useAzureForExperiment &&
              (!selectedModel || !selectedDatasetId)
            ) {
              setNotification("Please select a model, and dataset.", "error");
              return;
            }
            if (
              !jawnSettings.data?.data?.useAzureForExperiment &&
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
        onSuccess={(datasetId) => {
          setSelectedDatasetId(datasetId);

          refetchDataSets();
        }}
      />
    </>,
    <>
      <div className="flex flex-col space-y-8">
        {/* TODO: make this diff more sophisticated */}
        <div className="p-8 rounded-lg bg-white border border-gray-300 flex flex-col space-y-4">
          <div className="grid grid-cols-4">
            <div className="col-span-2">
              <h2 className="text-md font-semibold">Original Prompt</h2>
            </div>
            <div className="col-span-2">
              <h2 className="text-md font-semibold">Experiment Prompt</h2>
            </div>
          </div>
          <ReactDiffViewer
            oldValue={JSON.stringify(template, null, 4)}
            newValue={JSON.stringify(currentChat, null, 4)}
            splitView={true}
          />
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
                    className="border-none focus:ring-0 focus:outline-none w-full py-0"
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
        className="w-full flex justify-between sticky bottom-0 bg-gray-100 py-4 border-t border-gray-300 dark:border-gray-700 dark:bg-gray-900"
      >
        <HcButton
          variant={"secondary"}
          size={"sm"}
          title={"Back"}
          onClick={() => {
            setCurrentStep(2);
          }}
        />
        <HcButton
          loading={isLoading}
          variant={"primary"}
          size={"sm"}
          title={"Confirm and run experiment"}
          onClick={async () => {
            if (
              jawnSettings.data?.data?.useAzureForExperiment &&
              (!selectedModel || !selectedDatasetId)
            ) {
              setNotification("Please select a model, and dataset.", "error");
              return;
            }
            if (
              !jawnSettings.data?.data?.useAzureForExperiment &&
              (!selectedModel || !selectedDatasetId || !selectedProviderKey)
            ) {
              setNotification(
                "Please select a model, dataset, and provider key.",
                "error"
              );
              return;
            }
            setIsLoading(true);
            // do a dummy delay for 2s

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
              setIsLoading(false);
              setNotification(
                "Error creating subversion. Please try again.",
                "error"
              );
              return;
            }

            // runs the experiment with the new dataset and new subversion
            const res = await jawn.POST("/v1/experiment", {
              body: {
                datasetId: selectedDatasetId,
                model: selectedModel,
                promptVersion: newSubVersion.data?.data?.id!,
                providerKeyId: jawnSettings.data?.data?.useAzureForExperiment
                  ? "NOKEY"
                  : selectedProviderKey,
              },
            });

            if (res.data?.error) {
              setIsLoading(false);
              setNotification(
                "Error running experiment. Please try again.",
                "error"
              );
              return;
            }

            setIsLoading(false);
            setNotification(
              "Experiment started successfully. Redirecting you to the prompt page",
              "success"
            );
            // reroute the user after 2 seconds
            setTimeout(() => {
              router.push(`/prompts/${id}`);
            }, 2000);
          }}
        />
      </div>
    </>,
  ];

  return (
    <>
      <div className="w-full h-full flex flex-col space-y-4 relative">
        <div className="flex flex-col items-start w-full">
          <HcBreadcrumb
            pages={[
              {
                href: "/prompts",
                name: "Prompts",
              },
              {
                href: `/prompts/${id}`,
                name: prompt?.user_defined_id || "Loading...",
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
        <div id="step-render" className="w-full">
          {renderStepArray[currentStep]}
        </div>
      </div>
    </>
  );
};

export default PromptNewExperimentPage;
