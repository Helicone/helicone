import {
  ArrowsPointingOutIcon,
  BookOpenIcon,
  BookmarkIcon,
  ChevronLeftIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Select, SelectItem } from "@tremor/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  usePrompts,
  usePrompt,
  usePromptVersions,
} from "../../../../services/hooks/prompts/prompts";

import ThemedDrawer from "../../../shared/themed/themedDrawer";
import ThemedModal from "../../../shared/themed/themedModal";
import { Chat } from "../../requests/chat";
import { clsx } from "../../../shared/clsx";
import { Tooltip } from "@mui/material";
import { BeakerIcon } from "@heroicons/react/24/solid";
import { ThemedPill } from "../../../shared/themed/themedPill";
import ExperimentForm from "./experimentForm";
import PromptPropertyCard from "./promptPropertyCard";
import { useOrg } from "../../../layout/organizationContext";
import { useJawnClient } from "../../../../lib/clients/jawnHook";

interface PromptIdPageProps {
  id: string;
}

const PromptNewExperimentPage = (props: PromptIdPageProps) => {
  const { id } = props;
  // const { prompt, isLoading } = usePrompt(id);
  const { prompts } = usePromptVersions(id);
  // const { prompt, isLoading } = usePrompts(id);

  const org = useOrg();

  const [selectedVersion, setSelectedVersion] = useState<string>();

  const [inputOpen, setInputOpen] = useState(false);
  const [experimentOpen, setExperimentOpen] = useState(false);

  // the selected request to view in the tempalte
  const [selectedInput, setSelectedInput] = useState<{
    id: string;
    createdAt: string;
    properties: Record<string, string>;
    response: string;
  }>();

  // set the selected version to the latest version on initial load

  const jawn = useJawnClient();

  return (
    <>
      <div>
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
      </div>
      {/* {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="flex flex-col min-h-[80vh] h-full">
          <div className="w-full flex flex-col space-y-4 py-4">
            {currentPrompt ? (
              <>
                <div
                  id="toolbar"
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center space-x-1">
                    <button
                      className="border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
                      onClick={() => setExperimentOpen(!experimentOpen)}
                    >
                      <BeakerIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block">
                        Run Experiment
                      </p>
                    </button>

                    <button
                      onClick={() => setInputOpen(!inputOpen)}
                      className="border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
                    >
                      <PaintBrushIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block">
                        View Inputs
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        const randomInput = Math.floor(
                          Math.random() *
                            (selectedPrompt.properties?.length || 0)
                        );

                        const randomProperty =
                          selectedPrompt.properties?.[randomInput];

                        setSelectedInput(randomProperty);
                      }}
                      className="border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
                    >
                      <SparklesIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block pr-1">
                        Random Input
                      </p>
                    </button>
                    {selectedInput && (
                      <ThemedPill
                        label={selectedInput.id}
                        onDelete={() => setSelectedInput(undefined)}
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <label className="text-black dark:text-white">
                      Version:
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
                </div>
                {selectedVersion === undefined ? (
                  <div className="flex flex-col w-full h-96 justify-center items-center">
                    <div className="flex flex-col w-2/5">
                      <DocumentTextIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
                      <p className="text-xl text-black dark:text-white font-semibold mt-8">
                        Select a version
                      </p>
                      <p className="text-sm text-gray-500 max-w-sm mt-2">
                        Select a version to view the prompt and its output.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-4 w-full">
                    <div className="flex flex-col space-y-8 w-full">
                      {selectedPrompt.isLoading ? (
                        <h1>Loading...</h1>
                      ) : (
                        <div className="w-full">
                          <Chat
                            requestBody={selectedPrompt.heliconeTemplate}
                            responseBody={{
                              role: "assistant",
                              choices: [
                                {
                                  message: {
                                    content:
                                      selectedInput?.response ||
                                      `<helicone-prompt-input key="output" />`,
                                    role: "assistant",
                                  },
                                },
                              ],
                            }}
                            status={200}
                            requestId={""}
                            model={selectedPrompt.heliconeTemplate.model}
                            selectedProperties={selectedInput?.properties}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col w-full h-96 justify-center items-center">
                <div className="flex flex-col w-2/5">
                  <DocumentTextIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
                  <p className="text-xl text-black dark:text-white font-semibold mt-8">
                    Select a prompt to get started.
                  </p>
                  <p className="text-sm text-gray-500 max-w-sm mt-2">
                    If you do not have any prompts, please view our
                    documentation to get started.
                  </p>
                  <div className="mt-4">
                    <Link
                      href="#"
                      className="w-fit items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <BookOpenIcon className="h-4 w-4" />
                      View Docs
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )} */}
      {/* <ThemedDrawer
        open={experimentOpen}
        setOpen={setExperimentOpen}
        defaultExpanded={true}
      >
        <ExperimentForm
          heliconeTemplate={selectedPrompt.heliconeTemplate}
          currentPrompt={currentPrompt!}
          promptProperties={selectedPrompt.properties || []}
          close={() => setExperimentOpen(false)}
        />
      </ThemedDrawer>
      <ThemedDrawer open={inputOpen} setOpen={setInputOpen}>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <PaintBrushIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Inputs
            </h2>
          </div>
        </div>
        <ul className="flex flex-col space-y-4 mt-8 w-full">
          {selectedPrompt?.properties?.map((row, i) => (
            <PromptPropertyCard
              key={`selectedPrompt-${i}`}
              isSelected={selectedInput?.id === row.id}
              onSelect={() => {
                if (selectedInput?.id === row.id) {
                  setSelectedInput(undefined);
                  return;
                }
                setSelectedInput(row);
              }}
              requestId={row.id}
              createdAt={row.createdAt}
              properties={row.properties}
            />
          ))}
        </ul>
      </ThemedDrawer> */}
    </>
  );
};

export default PromptNewExperimentPage;
