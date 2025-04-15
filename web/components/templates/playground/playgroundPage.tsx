import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CodeBracketSquareIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { MultiSelect, MultiSelectItem } from "@tremor/react";
import Image from "next/image";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDebounce } from "../../../services/hooks/debounce";
import { usePlaygroundPage } from "../../../services/hooks/playground";
import AuthHeader from "../../shared/authHeader";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import RequestDrawerV2 from "../requests/requestDrawerV2";
import ChatPlayground from "./chatPlayground";

import { TooltipLegacy as Tooltip } from "@/components/ui/tooltipLegacy";
import { ChatCompletionTool } from "openai/resources";
import {
  playgroundModels as PLAYGROUND_MODELS,
  playgroundModels,
} from "../../../packages/cost/providers/mappings";
import FunctionButton from "./functionButton";

import { useOrg } from "@/components/layout/org/organizationContext";
import { FeatureUpgradeCard } from "@/components/shared/helicone/FeatureUpgradeCard";
import { IslandContainer } from "@/components/ui/islandContainer";
import { Slider } from "@/components/ui/slider";
import {
  requestOptionsFromOpenAI,
  usePlaygroundRuntime,
} from "@assistant-ui/react-playground";
import { useQuery } from "@tanstack/react-query";
import { TestTubeDiagonal } from "lucide-react";
import "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism.css";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import { PlaygroundModel } from "./types";

const PlaygroundPage = (props: PlaygroundPageProps) => {
  const { request } = props;
  const [requestId, setRequestId] = useState<string | undefined>(request ?? "");

  const [open, setOpen] = useState<boolean>(false);
  const [infoOpen, setInfoOpen] = useState<boolean>(false);

  const debouncedRequestId: string | undefined = useDebounce(requestId, 500);

  const { data, isLoading, chat, hasData, isChat, tools } = usePlaygroundPage(
    debouncedRequestId || ""
  );

  const [currentTools, setCurrentTools] = useState<ChatCompletionTool[]>();
  const [providerAPIKey, setProviderAPIKey] = useState<string>();

  const fineTuneModels = useFineTuneModels(providerAPIKey);

  const playgroundModels = useMemo(() => {
    return PLAYGROUND_MODELS.filter((model) => model.provider !== "AZURE")
      .concat(fineTuneModels.data || [])
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [fineTuneModels.data]);

  const singleRequest = data.length > 0 ? data[0] : null;
  const singleModel = useMemo(
    () => playgroundModels.find((model) => model.name === singleRequest?.model),
    [singleRequest?.model, playgroundModels]
  );

  const reqBody =
    singleRequest !== null ? (singleRequest.raw.request as any) : null;

  const [temperature, setTemperature] = useState<number>(
    reqBody !== null ? reqBody.temperature : 0.7
  );
  const [maxTokens, setMaxTokens] = useState<number>(
    reqBody !== null ? reqBody.max_tokens : 256
  );

  const [selectedModels, setSelectedModels] = useState<PlaygroundModel[]>([]);

  const org = useOrg();
  const hasAccess = useMemo(() => {
    return org?.currentOrg?.tier != "free";
  }, [org?.currentOrg?.tier]);

  useEffect(() => {
    if (
      singleModel &&
      !selectedModels.some((model) => model.name === singleModel.name)
    ) {
      setSelectedModels((prev) => [...prev, singleModel]);
    }
  }, [singleModel]);

  const { setNotification } = useNotification();

  useEffect(() => {
    const newTools = tools ?? [];
    setCurrentTools((prevTools) => {
      if (
        prevTools !== undefined &&
        JSON.stringify(prevTools) === JSON.stringify(newTools)
      ) {
        return prevTools;
      }
      return newTools;
    });
  }, [tools]);

  const [newPlaygroundOpen, setNewPlaygroundOpen] = useLocalStorage<boolean>(
    "newPlaygroundOpen",
    false
  );

  const transformedMessages: any[] = useMemo(() => {
    if (!chat.length) return [];

    return selectedModels?.[0]?.provider === "OPENAI"
      ? requestOptionsFromOpenAI({
          model: selectedModels?.[0]?.name || "gpt-3.5-turbo",
          messages: chat as any,
          tools: currentTools,
        }).messages
      : chat.map((msg) => ({
          role: msg.role as "user" | "assistant" | "system",
          content:
            typeof msg.content === "string"
              ? [{ type: "text" as const, text: msg.content }]
              : msg.content,
        }));
  }, [chat, selectedModels, currentTools]);

  const modelName: string = useMemo(
    () => selectedModels?.[0]?.name || "gpt-3.5-turbo",
    [selectedModels]
  );

  const runtime = usePlaygroundRuntime({
    api: "/api/aui",
    initialMessages: [] as any,
  });

  // Keep a stable reference to runtime
  const runtimeRef = useRef(runtime);
  useEffect(() => {
    runtimeRef.current = runtime;
  }, [runtime]);

  // Before the useEffect for runtime, add a ref to hold previous messages
  const prevTransformedMessagesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!debouncedRequestId || !transformedMessages.length) return;
    // For non-OPENAI providers (like Anthropics), skip updating the runtime to prevent rerenders
    if (selectedModels?.[0]?.provider !== "OPENAI") return;

    if (
      JSON.stringify(prevTransformedMessagesRef.current) !==
      JSON.stringify(transformedMessages)
    ) {
      prevTransformedMessagesRef.current = transformedMessages;
      runtimeRef.current.thread.setRequestData({
        modelName,
        messages: transformedMessages,
      } as any);
    }
  }, [debouncedRequestId, transformedMessages, modelName, selectedModels]);

  console.log("rerender");

  return !hasAccess ? (
    <div className="flex justify-center items-center bg-white">
      <FeatureUpgradeCard
        title="Playground"
        featureName="Playground"
        headerTagline="Test and iterate on LLM prompts"
        icon={<TestTubeDiagonal className="w-4 h-4 text-sky-500" />}
        featureImage={{
          type: "image",
          content: "/static/featureUpgrade/playground-preview.webp",
        }}
      />
    </div>
  ) : (
    <IslandContainer>
      <AuthHeader
        isWithinIsland
        title={"Playground"}
        actions={
          <div id="toolbar" className="flex flex-row items-center gap-2 w-full">
            <div className="max-w-sm w-[22rem]">
              <Input
                id="request-id"
                name="request-id"
                onChange={(e) => setRequestId(e.target.value)}
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
      <div className="flex justify-between w-full h-full gap-8 min-h-[80vh]">
        <div className="flex w-full h-full ">
          {isLoading ? (
            <div className="col-span-8 flex w-full border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-200 dark:bg-gray-800 h-96 animate-pulse dark:text-gray-100 items-center justify-center">
              Loading...
            </div>
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
            <div className="col-span-8 h-full max-w-full flex flex-col items-center justify-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 p-4 overflow-hidden">
              <p className="text-center mb-4">
                This request is not a chat completion request. We do not
                currently support non-chat completion requests in playground.
              </p>

              <div className="max-w-96 overflow-auto mt-4">
                <pre className="text-xs whitespace-pre-wrap text-black dark:text-white break-words max-w-full">
                  {JSON.stringify(singleRequest, null, 2)}
                </pre>
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
                  _type: "message",
                },
                {
                  id: "2",
                  content:
                    "Welcome to the playground! This is a space where you can replay user requests, experiment with various prompts, and test different models. Feel free to explore and interact with the available features. Let's get started!",
                  _type: "message",
                  role: "assistant",
                },
                {
                  id: "3",
                  content: "What is the weather in Tokyo?",
                  _type: "message",
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
        <div className="flex flex-col w-full max-w-[16rem] h-full space-y-8 ">
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
                      playgroundModels.find((model) => model.name === value)!
                  )
                );
              }}
              className=""
            >
              {playgroundModels.map((model, idx) => (
                <MultiSelectItem
                  value={model.name}
                  key={idx}
                  className="font-medium text-black"
                >
                  {model.name || ""}
                </MultiSelectItem>
              ))}
            </MultiSelect>
          </div>
          <div className="flex flex-col space-y-2 w-full">
            <div className="flex flex-row w-full justify-between items-center">
              <label
                htmlFor="temp"
                className="flex gap-1 font-medium text-sm text-gray-900 dark:text-gray-100"
              >
                <span>Provider API Key</span>

                <Tooltip
                  title={
                    "Your API keys are required to use fine-tuned models in the playground."
                  }
                  placement="top-end"
                >
                  <InformationCircleIcon className="h-5 w-5 text-gray-500" />
                </Tooltip>
              </label>
            </div>
            <Input
              type="password"
              value={providerAPIKey}
              placeholder="Enter your provider API Key (optional)"
              onChange={(e) => {
                setProviderAPIKey(e.target.value);
              }}
              className="w-full text-sm px-2 py-1 rounded-lg border border-gray-300"
            />
          </div>
          {!selectedModels.some(
            (model) => model.name.includes("o1") || model.name.includes("o3")
          ) && (
            <div className="flex flex-col space-y-2 w-full">
              <div className="flex flex-row w-full justify-between items-center">
                <label
                  htmlFor="temp"
                  className="font-medium text-sm text-gray-900 dark:text-gray-100"
                >
                  Temperature
                </label>
                <Input
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
                  min={0.01}
                  max={1.99}
                  step={0.01}
                  className="w-14 text-sm px-2 py-1 rounded-lg border border-gray-300"
                />
              </div>
              <Slider
                value={[temperature]}
                onValueChange={(value) => {
                  setTemperature(value[0]);
                }}
                min={0.01}
                max={1.99}
                step={0.01}
              />
            </div>
          )}
          {!selectedModels.some(
            (model) => model.name.includes("o1") || model.name.includes("o3")
          ) && (
            <div className="flex flex-col space-y-2 w-full">
              <div className="flex flex-row w-full justify-between items-center">
                <label
                  htmlFor="tokens"
                  className="font-medium text-sm text-gray-900 dark:text-gray-100"
                >
                  Max Tokens
                </label>
                <Input
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
              <Slider
                value={[maxTokens]}
                onValueChange={(value) => {
                  setMaxTokens(value[0]);
                }}
                min={1}
                max={2048}
                step={1}
              />
            </div>
          )}
          <div className="flex flex-col space-y-2 w-full">
            <div className="flex flex-row w-full space-x-1 items-center">
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                Tools
              </p>
              <Button
                variant={"ghost"}
                size={"xs"}
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
    </IslandContainer>
  );
};

export default PlaygroundPage;

/** Types and Function for using finetuned models in Playground, Experiments Page */
interface PlaygroundPageProps {
  showNewButton?: boolean;
  request?: string;
}

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

export async function fetchFineTuneModels(
  providerAPIKey: string | undefined,
  setPlaygroundModels: Dispatch<SetStateAction<PlaygroundModel[]>>
) {
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

  setPlaygroundModels((prev) => playgroundModels.concat(ftModels));
}

export function useFineTuneModels(providerAPIKey: string | undefined) {
  return useQuery({
    queryKey: ["fine-tune-models", providerAPIKey],
    queryFn: async (query) => {
      const providerAPIKey = query.queryKey[1];
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

      return ftModels;
    },
  });
}
