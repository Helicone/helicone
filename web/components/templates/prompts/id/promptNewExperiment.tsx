import { useState } from "react";
import {
  usePrompt,
  usePromptVersions,
} from "../../../../services/hooks/prompts/prompts";

import { useOrg } from "../../../layout/organizationContext";
import { useJawnClient } from "../../../../lib/clients/jawnHook";
import HcBreadcrumb from "../../../ui/hcBreadcrumb";
import StepActions from "../../../shared/stepActions";
import HcButton from "../../../ui/hcButton";
import { Select, SelectItem } from "@tremor/react";
import HcBadge from "../../../ui/hcBadge";
import { clsx } from "../../../shared/clsx";
import { RenderImageWithPrettyInputKeys } from "./promptIdPage";
import { RenderWithPrettyInputKeys } from "../../playground/chatRow";
import ChatPlayground from "../../playground/chatPlayground";

interface PromptIdPageProps {
  id: string;
}

const PromptNewExperimentPage = (props: PromptIdPageProps) => {
  const { id } = props;
  const { prompt, isLoading } = usePrompt(id);
  const { prompts } = usePromptVersions(id);
  const jawn = useJawnClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState<{
    id: string;
    minor_version: number;
    major_version: number;
    helicone_template: string;
    prompt_v2: string;
    model: string;
  }>();

  const template = JSON.parse(
    JSON.stringify(selectedPrompt?.helicone_template ?? "")
  ).messages;

  const renderStepArray = [
    <div className="flex flex-col">
      <div className="mt-2 flex flex-col h-full items-center justify-center">
        <div className="h-full w-full border border-gray-300 dark:border-gray-700 rounded-lg">
          <div className="w-full flex justify-between items-center py-2 px-4 border-b border-gray-300 dark:border-gray-700 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-500">Version:</label>
              <Select>
                {prompts?.map((prompt) => (
                  <SelectItem
                    value={`${prompt.major_version}.${prompt.minor_version}`}
                  >
                    {prompt.major_version}.{prompt.minor_version}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>
          <ul className="divide-y divide-gray-300 dark:divide-gray-700">
            {prompts
              ?.sort(
                (a, b) =>
                  // sort by major version first, then minor version. ex. 5.4 -> 5.3 -> 5.2 -> 4.5 -> 4.4
                  b.major_version - a.major_version ||
                  b.minor_version - a.minor_version
              )
              .map((prompt, index) => {
                const template = JSON.parse(
                  JSON.stringify(prompt.helicone_template)
                ).messages[0].content;
                return (
                  <li
                    key={prompt.id}
                    className={clsx(
                      index === prompts.length - 1 ? "rounded-b-lg" : "",
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
                      onClick={() => {
                        if (selectedPrompt?.id === prompt.id) {
                          setSelectedPrompt(undefined);
                        } else {
                          setSelectedPrompt(prompt);
                        }
                      }}
                    />
                    <div className="flex flex-col space-y-1 w-1/4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">
                          V{prompt.major_version}.{prompt.minor_version}
                        </span>
                        {index === 0 && (
                          <HcBadge title={"Latest"} size={"sm"} />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        created on 03-29-2024
                      </div>
                    </div>
                    <div className="w-full border border-gray-300 dark:border-gray-700 border-dashed p-4 bg-gray-100 rounded-lg text-sm whitespace-pre-wrap">
                      <RenderWithPrettyInputKeys
                        text={
                          template.length > 200
                            ? `${template.substring(0, 200)}...`
                            : template
                        }
                        selectedProperties={undefined}
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    </div>,
    <div className="">
      <ChatPlayground
        requestId={""}
        chat={template}
        models={[]}
        temperature={0.5}
        maxTokens={256}
        submitText={"Save Changes"}
      />
    </div>,
    <div className="flex items-center space-x-2">
      Step 3: - Select model and dataset
    </div>,
    <div className="flex items-center space-x-2">
      Step 4: - Submit new prompt and run experiment
    </div>,
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
        />
        <div id="step-render" className="w-full">
          {renderStepArray[currentStep]}
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
              if (currentStep === 0) {
                // dont do anything
              } else {
                setCurrentStep(currentStep - 1);
              }
            }}
          />
          <HcButton
            variant={"primary"}
            size={"sm"}
            title={"Continue"}
            onClick={() => {
              if (currentStep === renderStepArray.length - 1) {
                // submit experiment
              } else {
                setCurrentStep(currentStep + 1);
              }
            }}
          />
        </div>
      </div>
      {/* <div className="pt-36">
        <div className="flex items-center space-x-2">
          Step 1: - Choose prompt
        </div>
        <div className="mt-2 flex flex-col min-h-[30vh] h-full bg-blue-200 items-center justify-center">
          {prompts?.map((prompt) => (
            <div key={prompt.id} className="flex items-center space-x-2 gap-2">
              <div>
                {prompt.major_version}.{prompt.minor_version}
              </div>
              {" - "}
              {JSON.stringify(prompt.helicone_template).substring(0, 30)}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center space-x-2">Step 2: - Edit prompt</div>
      <div>
        <div className="flex items-center space-x-2">
          Step 3: - Select model and dataset
        </div>
        <div className="mt-2 flex flex-col min-h-[30vh] h-full bg-blue-200 items-center justify-center">
          <div className="flex flex-col items-center space-x-2">
            Step 3.1: - Create Dataset
            <button
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
              onClick={() =>
                jawn.POST("/v1/experiment/dataset", {
                  body: {
                    datasetName: "test",
                    requestIds: [
                      "3e257235-0343-4ed6-bb44-f9a63d321615",
                      "a1263ab8-f0ec-4d15-9c25-61485213a69f",
                    ],
                  },
                })
              }
            >
              Create Dataset From request Ids
            </button>
            <button
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
              onClick={() =>
                jawn.POST("/v1/experiment/dataset/random", {
                  body: {
                    datasetName: "testRandom",
                    filter: {
                      prompts_versions: {
                        prompt_v2: {
                          equals: id,
                        },
                      },
                    },
                    limit: 2,
                    offset: 0,
                  },
                })
              }
            >
              Create random dataset
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          Step 4: - Submit new prompt and run experiment
        </div>
        <div className="mt-2 flex flex-col min-h-[30vh] h-full bg-blue-200 items-center justify-center">
          <button
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
            onClick={async () => {
              const res = await jawn.POST(
                "/v1/prompt/version/{promptVersionId}/subversion",
                {
                  body: {
                    newHeliconeTemplate: {
                      model: "gpt-3.5-turbo",
                      messages: [
                        {
                          role: "system",
                          content:
                            '<helicone-prompt-input key="test2" />sdafsadfadsfads <helicone-prompt-input key="test" />Applsadfslaksdjlfd!',
                        },
                      ],
                    },
                  },
                  params: {
                    path: {
                      promptVersionId: prompts?.[0].id ?? "",
                    },
                  },
                }
              );

              jawn.POST("/v1/experiment", {
                body: {
                  datasetId: "2c55f92f-e004-450c-b74e-d85c8c60194b",
                  model: "gpt-3.5-turbo",
                  promptVersion: res.data?.data?.id ?? "",
                },
              });
            }}
          >
            Run Experiment
          </button>
        </div>
      </div> */}
    </>
  );
};

export default PromptNewExperimentPage;
