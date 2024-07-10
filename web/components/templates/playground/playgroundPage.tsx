import { useEffect, useState } from "react";
import { usePlaygroundPage } from "../../../services/hooks/playground";
import { clsx } from "../../shared/clsx";
import ChatPlayground from "./chatPlayground";
import { useDebounce } from "../../../services/hooks/debounce";
import AuthHeader from "../../shared/authHeader";
import RequestDrawerV2 from "../requestsV2/requestDrawerV2";
import useNotification from "../../shared/notification/useNotification";
import {
  CodeBracketSquareIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { MultiSelect, MultiSelectItem, TextInput } from "@tremor/react";
import ThemedModal from "../../shared/themed/themedModal";
import Image from "next/image";

import {
  ProviderName,
  playgroundModels,
} from "../../../packages/cost/providers/mappings";
import FunctionButton from "./functionButton";
import HcButton from "../../ui/hcButton";
import { PlusIcon } from "@heroicons/react/20/solid";
import { ChatCompletionTool } from "openai/resources";
interface PlaygroundPageProps {
  request?: string;
}

export type PlaygroundModel = {
  name: string;
  provider: ProviderName;
};

export type TFinetunedJob = {
  object: string;
  id: string;
  model: string;
  created_at: number;
  finished_at: number;
  fine_tuned_model: string;
  organization_id: string;
  result_files: Array<string>;
  status:
    | "validating_files"
    | "queued"
    | "running"
    | "succeeded"
    | "failed"
    | "cancelled";
  validation_file: any;
  training_file: string;
  hyperparameters: {
    n_epochs: number;
    batch_size: number;
    learning_rate_multiplier: number;
  };
  trained_tokens: number | null;
  integrations: Array<any>;
  seed: number;
  estimated_finish: number;
};

const PlaygroundPage = (props: PlaygroundPageProps) => {
  const { request } = props;
  const [requestId, setRequestId] = useState<string | undefined>(request ?? "");

  const [open, setOpen] = useState<boolean>(false);
  const [infoOpen, setInfoOpen] = useState<boolean>(false);

  const debouncedRequestId = useDebounce(requestId, 500);

  const { data, isLoading, chat, hasData, isChat, tools } = usePlaygroundPage(
    debouncedRequestId || ""
  );

  const [currentTools, setCurrentTools] = useState<ChatCompletionTool[]>();
  const [providerAPIKey, setProviderAPIKey] = useState<string>();

  const [PLAYGROUND_MODELS, setPLAYGROUND_MODELS] = useState<PlaygroundModel[]>(
    playgroundModels
      .filter((model) => model.provider !== "AZURE")
      .sort((a, b) => a.name.localeCompare(b.name))
  );

  const singleRequest = data.length > 0 ? data[0] : null;
  const singleModel = PLAYGROUND_MODELS.find(
    (model) => model.name === singleRequest?.model
  );

  const reqBody =
    singleRequest !== null ? (singleRequest.requestBody as any) : null;

  const [temperature, setTemperature] = useState<number>(
    reqBody !== null ? reqBody.temperature : 0.7
  );
  const [maxTokens, setMaxTokens] = useState<number>(
    reqBody !== null ? reqBody.max_tokens : 256
  );

  const [selectedModels, setSelectedModels] = useState<PlaygroundModel[]>(
    singleModel
      ? [
          {
            ...singleModel,
          },
        ]
      : []
  );

  const { setNotification } = useNotification();

  useEffect(() => {
    if (tools !== undefined) {
      setCurrentTools(tools);
    } else {
      setCurrentTools([]);
    }
  }, [tools, requestId]);

  async function fetchFineTuneModels() {
    // Using user's own api key, so no need to use /api routes
    const res = await fetch("https://api.openai.com/v1/fine_tuning/jobs", {
      headers: {
        Authorization: `Bearer ${providerAPIKey}`,
        "Content-Type": "application/json",
      },
    });
    const ftJobsList = await res.json();
    if (ftJobsList.error) return;

    const ftJobs = ftJobsList.data as Array<TFinetunedJob>;

    const ftModels = ftJobs
      .map((job) => {
        if (job.status === "succeeded") {
          return {
            name: job.fine_tuned_model,
            provider: "OPENAI",
          };
        }
      })
      .filter((model) => model !== undefined) as PlaygroundModel[];

    setPLAYGROUND_MODELS((prev) => prev.concat(ftModels));
  }

  useEffect(() => {
    fetchFineTuneModels();
  }, [providerAPIKey]);

  return (
    <>
      <AuthHeader
        title={"Playground"}
        actions={
          <div id="toolbar" className="flex flex-row items-center gap-2 w-full">
            <div className="max-w-sm w-[22rem]">
              <TextInput
                id="request-id"
                name="request-id"
                onValueChange={(e) => setRequestId(e)}
                value={requestId}
                placeholder="Enter in a Request ID"
                className="w-full"
              />
            </div>

            <button
              disabled={singleRequest === null}
              onClick={() => {
                if (singleRequest === null) {
                  setNotification("Invalid Request", "error");
                  return;
                }
                setOpen(true);
              }}
              className={clsx(
                singleRequest === null ? "opacity-50" : "",
                "bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
              )}
            >
              <CodeBracketSquareIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block">
                View Source
              </p>
            </button>
          </div>
        }
      />
      <div className="flex justify-between w-full h-full gap-8 min-h-[80vh] border-t border-gray-300 pt-8">
        <div className="flex w-full h-full">
          {isLoading ? (
            <div className="col-span-8 flex w-full border border-gray-300 rounded-lg bg-gray-200 h-96 animate-pulse" />
          ) : hasData && isChat && singleRequest !== null ? (
            <>
              <ChatPlayground
                requestId={requestId || ""}
                chat={chat}
                models={selectedModels}
                temperature={temperature}
                maxTokens={maxTokens}
                tools={currentTools}
                providerAPIKey={providerAPIKey}
              />
            </>
          ) : singleRequest !== null && !isChat ? (
            <div className="col-span-8 h-96 items-center justify-center flex flex-col border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500">
              This request is not a chat completion request. We do not currently
              support non-chat completion requests in playground
              {JSON.stringify(chat, null, 4)}
              <div className="whitespace-pre-wrap text-black overflow-auto">
                {JSON.stringify(singleRequest, null, 4)}
              </div>
            </div>
          ) : debouncedRequestId === "" ? (
            <ChatPlayground
              requestId={"requestId"}
              chat={[
                {
                  id: "1",
                  content: "Hi, what can I do in the playground?",
                  role: "user",
                },
                {
                  id: "2",
                  content:
                    "Welcome to the playground! This is a space where you can replay user requests, experiment with various prompts, and test different models. Feel free to explore and interact with the available features. Let's get started!",
                  role: "assistant",
                },
                {
                  id: "3",
                  content: "What is the weather in Tokyo?",
                  role: "user",
                },
              ]}
              models={selectedModels}
              temperature={temperature}
              maxTokens={maxTokens}
              providerAPIKey={providerAPIKey}
            />
          ) : (
            <div className="w-full h-96 items-center justify-center flex flex-col border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500">
              No data found for this request. Please make sure the request is
              correct or try another request.
            </div>
          )}
        </div>
        <div className="flex flex-col w-full max-w-[16rem] h-full space-y-8">
          <div className="flex flex-col space-y-2 w-full">
            <div className="flex flex-row w-full space-x-1 items-center">
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                Models
              </p>
              <button
                onClick={() => {
                  setInfoOpen(true);
                }}
                className="hover:cursor-pointer"
              >
                <InformationCircleIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <MultiSelect
              placeholder="Select your models..."
              value={selectedModels?.map((model) => model.name) || []}
              onValueChange={(values: string[]) => {
                setSelectedModels(
                  values.map(
                    (value) =>
                      PLAYGROUND_MODELS.find((model) => model.name === value)!
                  )
                );
              }}
              className=""
            >
              {PLAYGROUND_MODELS.map((model, idx) => (
                <MultiSelectItem
                  value={model.name}
                  key={idx}
                  className="font-medium text-black"
                >
                  {model.name}
                </MultiSelectItem>
              ))}
            </MultiSelect>
          </div>
          <div className="flex flex-col space-y-2 w-full">
            <div className="flex flex-row w-full justify-between items-center">
              <label
                htmlFor="temp"
                className="font-medium text-sm text-gray-900 dark:text-gray-100"
              >
                Provider API Key
              </label>
            </div>
            <input
              type="password"
              value={providerAPIKey}
              placeholder="Enter your provider API Key"
              onChange={(e) => {
                setProviderAPIKey(e.target.value);
              }}
              className="w-full text-sm px-2 py-1 rounded-lg border border-gray-300"
            />
          </div>
          <div className="flex flex-col space-y-2 w-full">
            <div className="flex flex-row w-full justify-between items-center">
              <label
                htmlFor="temp"
                className="font-medium text-sm text-gray-900 dark:text-gray-100"
              >
                Temperature
              </label>
              <input
                type="number"
                id="temp"
                name="temp"
                value={temperature}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (value < 0.01) {
                    setTemperature(0.01);
                    return;
                  }
                  if (value > 1.99) {
                    setTemperature(1.99);
                    return;
                  }
                  setTemperature(parseFloat(e.target.value));
                }}
                min={0}
                max={1}
                step={0.01}
                className="w-14 text-sm px-2 py-1 rounded-lg border border-gray-300"
              />
            </div>
            <input
              type="range"
              id="temp-range"
              name="temp-range"
              min={0}
              max={1.99}
              step={0.01}
              value={temperature}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (value < 0.01) {
                  setTemperature(0.01);
                  return;
                }
                if (value > 1.99) {
                  setTemperature(1.99);
                  return;
                }
                setTemperature(parseFloat(e.target.value));
              }}
              className="text-black"
              style={{
                accentColor: "black",
              }}
            />
          </div>
          <div className="flex flex-col space-y-2 w-full">
            <div className="flex flex-row w-full justify-between items-center">
              <label
                htmlFor="tokens"
                className="font-medium text-sm text-gray-900 dark:text-gray-100"
              >
                Max Tokens
              </label>
              <input
                type="number"
                id="tokens"
                name="tokens"
                value={maxTokens}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (value < 1) {
                    setMaxTokens(1);
                    return;
                  }
                  if (value > 2048) {
                    setMaxTokens(2048);
                    return;
                  }
                  setMaxTokens(parseFloat(e.target.value));
                }}
                min={1}
                max={2048}
                step={1}
                className="w-14 text-sm px-2 py-1 rounded-lg border border-gray-300"
              />
            </div>
            <input
              type="range"
              id="token-range"
              name="token-range"
              min={1}
              max={2048}
              step={1}
              value={maxTokens}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (value < 1) {
                  setMaxTokens(1);
                  return;
                }
                if (value > 2048) {
                  setMaxTokens(2048);
                  return;
                }
                setMaxTokens(parseFloat(e.target.value));
              }}
              style={{
                accentColor: "black",
              }}
            />
          </div>
          <div className="flex flex-col space-y-2 w-full">
            <div className="flex flex-row w-full space-x-1 items-center">
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                Tools
              </p>
              <HcButton
                variant={"light"}
                size={"xs"}
                title={""}
                icon={PlusIcon}
                onClick={() => {
                  const defaultTool = {
                    type: "function",
                    function: {
                      name: `get_current_weather`,
                      description:
                        "Get the current weather in a given location",
                      parameters: {
                        type: "object",
                        properties: {
                          location: {
                            type: "string",
                            description:
                              "The city and state, e.g. San Francisco, CA",
                          },
                          unit: {
                            type: "string",
                            enum: ["celsius", "fahrenheit"],
                          },
                        },
                        required: ["location"],
                      },
                    },
                  };
                  // append the default tool to a deep copy of the current tools
                  const copy = JSON.parse(JSON.stringify(currentTools));
                  const newTools = copy.concat(defaultTool);

                  setCurrentTools(newTools);
                }}
              />
            </div>
            <ul className="flex flex-col space-y-2">
              {currentTools?.map((tool: ChatCompletionTool, index: number) => (
                <FunctionButton
                  key={index}
                  tool={tool}
                  onSave={(functionText: string) => {
                    // parse the function text and update the current tools
                    try {
                      // update the current tools
                      const newTools = JSON.parse(JSON.stringify(currentTools));
                      newTools[index].function = JSON.parse(functionText);
                      setCurrentTools(newTools);
                      setNotification("Function updated", "success");
                    } catch (e) {
                      console.error(e);
                      setNotification("Failed to update function", "error");
                    }
                  }}
                  onDelete={(name: string) => {
                    // delete the function from the current tools
                    const newTools = currentTools.filter(
                      (tool: any) => tool.function.name !== name
                    );
                    setCurrentTools(newTools);
                  }}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>

      <ThemedModal open={infoOpen} setOpen={setInfoOpen}>
        <div className="w-[450px] flex flex-col space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Experiment with Models
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Easily experiment with different models and parameters to see how
            they affect your chats. Different experiments will{" "}
            <span className="font-semibold italic">use the same model</span> for
            the entire conversation.
          </p>
          <div className="flex justify-center">
            <Image
              src={"/assets/playground/playground-graphic.png"}
              height={400}
              width={300}
              alt={"playground-graphic"}
            />
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            For the experiments above, the conversation for{" "}
            <span className="font-semibold italic">gpt-3.5-turbo</span> will
            take the flow: A - B - D - E
          </p>
        </div>
      </ThemedModal>
      {singleRequest !== null && (
        <RequestDrawerV2
          open={open}
          setOpen={setOpen}
          request={singleRequest}
          properties={[]}
        />
      )}
    </>
  );
};

export default PlaygroundPage;
