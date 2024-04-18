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

interface PromptIdPageProps {
  id: string;
}

const PromptNewExperimentPage = (props: PromptIdPageProps) => {
  const { id } = props;
  const { prompt, isLoading } = usePrompt(id);
  const { prompts } = usePromptVersions(id);
  const jawn = useJawnClient();
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <>
      <div className="w-full h-full flex flex-col space-y-8 relative">
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
          <h1 className="font-semibold text-4xl text-black dark:text-white pt-4">
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
              description: "Select a prompt to run an experiment.",
            },
            {
              id: 1,
              name: "Edit Prompt",
              description: "Edit the prompt to suit your experiment.",
            },
            {
              id: 2,
              name: "Select Model and Dataset",
              description: "Configure the experiment",
            },
            {
              id: 3,
              name: "Confirm",
              description: "Finalize and run experiment",
            },
          ]}
        />
        <div id="step-render" className="h-[200vh] w-full">
          x
        </div>
        <div
          id="step-inc"
          className="w-full flex justify-between sticky bottom-0 bg-gray-100 py-4 border-t border-gray-300 dark:border-gray-700 dark:bg-gray-900"
        >
          <HcButton variant={"secondary"} size={"sm"} title={"Back"} />
          <HcButton variant={"primary"} size={"sm"} title={"Continue"} />
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
