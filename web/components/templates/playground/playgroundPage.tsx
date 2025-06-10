import { useEffect, useMemo, useRef, useState } from "react";
import { playgroundModels as PLAYGROUND_MODELS } from "@helicone-package/cost/providers/mappings";
import AuthHeader from "../../shared/authHeader";
import useNotification from "../../shared/notification/useNotification";
import { useGetRequestWithBodies } from "@/services/hooks/requests";
import { OPENROUTER_MODEL_MAP } from "./new/openRouterModelMap";
import {
  MappedLLMRequest,
  Tool,
  Provider,
} from "@helicone-package/llm-mapper/types";
import { generateStream } from "@/lib/api/llm/generate-stream";
import { processStream } from "@/lib/api/llm/process-stream";
import { CommandItem } from "@/components/ui/command";
import {
  CommandEmpty,
  CommandGroup,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { CommandInput } from "@/components/ui/command";
import { Command } from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Check,
  ChevronsUpDownIcon,
  CommandIcon,
  Loader2,
  Undo2Icon,
} from "lucide-react";
import Chat from "../requests/components/Chat";
import { openaiChatMapper } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";
import findBestMatch from "string-similarity-js";
import ToolsConfigurationModal from "./components/ToolsConfigurationModal";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { ResizablePanelGroup } from "@/components/ui/resizable";
import { openAIMessageToHeliconeMessage } from "@helicone-package/llm-mapper/mappers/openai/chat";
import { FlaskConicalIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { v4 as uuidv4 } from "uuid";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocalStorage } from "@/services/hooks/localStorage";
import _ from "lodash";
import { Skeleton } from "@/components/ui/skeleton";
import { heliconeRequestToMappedContent } from "@helicone-package/llm-mapper/utils/getMappedContent";
import ModelParametersForm from "./components/ModelParametersForm";

export interface ModelParameters {
  temperature: number | null | undefined;
  maxTokens: number | null | undefined;
  topP: number | null | undefined;
  frequencyPenalty: number | null | undefined;
  presencePenalty: number | null | undefined;
  stop: string | null | undefined;
}

const DEFAULT_EMPTY_CHAT: MappedLLMRequest = {
  _type: "openai-chat",
  id: "",
  preview: {
    request: "You are a helpful AI assistant.",
    response: "",
    concatenatedMessages: [
      {
        _type: "message",
        role: "system",
        content: "You are a helpful AI assistant.",
      },
    ],
  },
  model: "gpt-3.5-turbo",
  raw: {
    request: {},
    response: {},
  },
  heliconeMetadata: {
    requestId: "",
    path: "",
    countryCode: null,
    cacheEnabled: false,
    cacheReferenceId: null,
    createdAt: new Date().toISOString(),
    totalTokens: null,
    promptTokens: null,
    completionTokens: null,
    latency: null,
    user: null,
    status: {
      code: 200,
      statusType: "success",
    },
    customProperties: null,
    cost: null,
    feedback: {
      createdAt: null,
      id: null,
      rating: null,
    },
    provider: "OPENAI" as Provider,
  },
  schema: {
    request: {
      messages: [
        {
          _type: "message",
          role: "system",
          content: "You are a helpful AI assistant.",
        },
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      tools: [],
      response_format: { type: "text" },
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: [],
    },
  },
};

const PlaygroundPage = (props: PlaygroundPageProps) => {
  const { requestId } = props;

  const [modelListOpen, setModelListOpen] = useState<boolean>(false);

  const { data: requestData, isLoading: isRequestLoading } =
    useGetRequestWithBodies(requestId ?? "");

  const [selectedModel, setSelectedModel] = useState<string>("gpt-3.5-turbo");

  const [defaultContent, setDefaultContent] = useState<MappedLLMRequest | null>(
    null
  );

  const [mappedContent, setMappedContent] =
    useLocalStorage<MappedLLMRequest | null>(
      `playground-${requestId || "clear"}`,
      null
    );

  useEffect(() => {
    if (!requestId) {
      setMappedContent(DEFAULT_EMPTY_CHAT);
    }
  }, [requestId]);

  const [tools, setTools] = useState<Tool[]>([]);

  const [modelParameters, setModelParameters] = useState<ModelParameters>({
    temperature: 0.7,
    maxTokens: 1000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    stop: "",
  });

  const [responseFormat, setResponseFormat] = useState<{
    type: string;
    json_schema?: string;
  }>({
    type: "text",
    json_schema: undefined,
  });

  useMemo(() => {
    if (requestData?.data && !isRequestLoading) {
      if (requestData.data.model in OPENROUTER_MODEL_MAP) {
        setSelectedModel(OPENROUTER_MODEL_MAP[requestData.data.model]);
      } else {
        const similarities = Object.keys(OPENROUTER_MODEL_MAP).map((m) => ({
          target: m,
          similarity: findBestMatch(requestData.data.model, m),
        }));

        const closestMatch = similarities.reduce((best, current) =>
          current.similarity > best.similarity ? current : best
        );
        setSelectedModel(OPENROUTER_MODEL_MAP[closestMatch.target]);
      }

      const content = heliconeRequestToMappedContent(requestData.data);
      const contentWithIds = {
        ...content,
        schema: {
          ...content.schema,
          request: {
            ...content.schema.request,
            messages:
              content.schema.request.messages?.map((message) => ({
                ...message,
                id: uuidv4(),
              })) ?? [],
          },
        },
      };
      if (!mappedContent) {
        setMappedContent(contentWithIds);
      }
      setDefaultContent(contentWithIds);
      setTools(mappedContent?.schema.request.tools ?? []);
      setModelParameters({
        temperature: content.schema.request.temperature,
        maxTokens: content.schema.request.max_tokens,
        topP: content.schema.request.top_p,
        frequencyPenalty: content.schema.request.frequency_penalty,
        presencePenalty: content.schema.request.presence_penalty,
        stop: content.schema.request.stop
          ? Array.isArray(content.schema.request.stop)
            ? content.schema.request.stop.join(",")
            : content.schema.request.stop
          : undefined,
      });
      return mappedContent;
    }
    return DEFAULT_EMPTY_CHAT;
  }, [requestData, isRequestLoading]);

  const [response, setResponse] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { setNotification } = useNotification();
  const abortController = useRef<AbortController | null>(null);
  const [isStreaming, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (response) {
      const newMessageMappedResponse = openAIMessageToHeliconeMessage(
        JSON.parse(response)
      );
      if (!mappedContent) {
        return;
      }
      setMappedContent({
        ...mappedContent,
        schema: {
          ...mappedContent.schema,
          response: {
            ...(mappedContent.schema.response ?? {}),
            messages: [newMessageMappedResponse],
          },
        },
      });
    }
  }, [mappedContent, response]);

  const onRun = async () => {
    if (!mappedContent) {
      setNotification("No mapped content", "error");
      return;
    }
    const openaiRequest = openaiChatMapper.toExternal({
      ...mappedContent.schema.request,
      tools,
      // temperature: modelParameters.temperature,
      // max_tokens: modelParameters.maxTokens,
      // top_p: modelParameters.topP,
      // frequency_penalty: modelParameters.frequencyPenalty,
      // presence_penalty: modelParameters.presencePenalty,
      // stop: modelParameters.stop,
      // response_format: responseFormat?.type ? responseFormat : undefined,
    } as any);

    try {
      setError(null);
      setIsLoading(true);
      abortController.current = new AbortController();

      try {
        const stream = await generateStream({
          ...openaiRequest,
          model: selectedModel,
          signal: abortController.current.signal,
          ...modelParameters,
          response_format:
            responseFormat?.type === "json_schema"
              ? {
                  type: "json_schema",
                  json_schema: responseFormat.json_schema,
                }
              : undefined,
        } as any);

        const result = await processStream(
          stream,
          {
            initialState: {
              content: "",
              reasoning: "",
              calls: "",
              fullContent: "",
            },
            onUpdate: (result) => {
              setError(null);
              setIsLoading(false);
              setResponse(result.fullContent);
            },
          },
          abortController.current.signal
        );

        if (result && result.error) {
          setError(result.error.message);
          console.error("error", result.error);
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            setError("Request was cancelled");
            setNotification("Request was cancelled", "error");
          } else {
            console.error("Error:", error);
            setError(
              error.message || "An error occurred while generating the response"
            );
            setNotification(
              error.message ||
                "An error occurred while generating the response",
              "error"
            );
          }
        }
      } finally {
        setIsLoading(false);
        abortController.current = null;
      }
    } catch (error) {
      setNotification("Failed to save prompt state", "error");
      setIsLoading(false);
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  };

  // Add keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onRun();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mappedContent]);

  return (
    <main className="h-screen flex flex-col w-full animate-fade-in">
      <AuthHeader
        title={"Playground"}
        actions={
          <div className="flex items-center gap-2">
            {mappedContent && !_.isEqual(mappedContent, defaultContent) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (defaultContent) {
                        setMappedContent(defaultContent);
                        setModelParameters({
                          temperature:
                            defaultContent.schema.request.temperature,
                          maxTokens: defaultContent.schema.request.max_tokens,
                          topP: defaultContent.schema.request.top_p,
                          frequencyPenalty:
                            defaultContent.schema.request.frequency_penalty,
                          presencePenalty:
                            defaultContent.schema.request.presence_penalty,
                          stop: defaultContent.schema.request.stop
                            ? Array.isArray(defaultContent.schema.request.stop)
                              ? defaultContent.schema.request.stop.join(",")
                              : defaultContent.schema.request.stop
                            : undefined,
                        });
                      } else {
                        setMappedContent(DEFAULT_EMPTY_CHAT);
                      }
                    }}
                  >
                    <Undo2Icon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Reset to {requestId ? `original request` : "blank content"}
                </TooltipContent>
              </Tooltip>
            )}
            {/* <ResponseFormatModal
              responseFormat={responseFormat.json_schema ?? ""}
              onResponseFormatChange={(format) => {
                setResponseFormat({
                  type: format ? "json_schema" : "text",
                  json_schema: format ? format : undefined,
                });
              }}
            />
            <ToolsConfigurationModal tools={tools} onToolsChange={setTools} /> */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onRun}>Run</Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-1">
                  <div className="p-1 rounded-md bg-muted">
                    <CommandIcon className="w-3 h-3" />
                  </div>
                  +{" "}
                  <div className="px-1 py rounded-md bg-muted">
                    <kbd className="text-xs">Enter</kbd>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        }
      />
      <div className="flex flex-col w-full h-full min-h-[80vh] border-t border-border">
        <div className="flex justify-between items-center px-4 py-2 border-b border-border bg-sidebar-background w-full">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex justify-between items-center w-full cursor-pointer">
              <Popover open={modelListOpen} onOpenChange={setModelListOpen}>
                <PopoverTrigger
                  asChild
                  onClick={(e) => {
                    e.stopPropagation();
                    setModelListOpen(!modelListOpen);
                  }}
                >
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={modelListOpen}
                    className="w-[200px] justify-between"
                  >
                    <span className="truncate max-w-[150px]">
                      {selectedModel || "Select model..."}
                    </span>
                    <ChevronsUpDownIcon className="opacity-50 w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search model..." />
                    <CommandList>
                      <CommandEmpty>No framework found.</CommandEmpty>
                      <CommandGroup>
                        {PLAYGROUND_MODELS.map((model) => (
                          <CommandItem
                            key={model}
                            value={model}
                            onSelect={(currentValue) => {
                              setSelectedModel(
                                currentValue === selectedModel
                                  ? ""
                                  : currentValue
                              );
                              setModelListOpen(false);
                            }}
                          >
                            {model}
                            <Check
                              className={cn(
                                "ml-auto",
                                model === selectedModel
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <div className="flex items-center gap-2">
                <ToolsConfigurationModal
                  tools={tools}
                  onToolsChange={setTools}
                />

                <ModelParametersForm
                  responseFormat={responseFormat}
                  onResponseFormatChange={setResponseFormat}
                  parameters={modelParameters}
                  onParametersChange={setModelParameters}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap text-slate-500">
              {Object.entries(modelParameters).map(([key, value], index) => (
                <div key={index}>
                  <p className="text-xs">
                    <span className="font-medium">{key}:</span>{" "}
                    {!value
                      ? "Default"
                      : typeof value === "string"
                      ? value
                      : Array.isArray(value)
                      ? value.length > 0
                        ? value.join(", ")
                        : "[]"
                      : value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            className="flex w-full h-full"
            defaultSize={70}
            minSize={30}
          >
            <ScrollArea className="w-full h-full">
              {(() => {
                if (!mappedContent) {
                  return (
                    <div className="flex flex-col w-full h-full">
                      {/* Message Role Header Skeleton */}
                      <div className="h-12 w-full flex flex-row items-center justify-between px-4 sticky top-0 bg-sidebar-background dark:bg-black z-10">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-24" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </div>
                      {/* Message Content Skeleton */}
                      <div className="w-full flex flex-col px-4 pb-4 pt-0">
                        <Skeleton className="w-full h-32 mt-4" />
                      </div>
                      {/* Additional Message Skeleton */}
                      <div className="h-12 w-full flex flex-row items-center justify-between px-4 border-t border-border">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-24" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </div>
                      <div className="w-full flex flex-col px-4 pb-4 pt-0">
                        <Skeleton className="w-full h-24 mt-4" />
                      </div>
                    </div>
                  );
                }
                switch (mappedContent?._type) {
                  case "openai-chat":
                  case "anthropic-chat":
                  case "gemini-chat":
                    return (
                      <Chat
                        mappedRequest={mappedContent as MappedLLMRequest}
                        mode="PLAYGROUND_INPUT"
                        onChatChange={(mappedRequest) => {
                          setMappedContent(mappedRequest);
                        }}
                      />
                    );
                  default:
                    return (
                      <div className="flex flex-col gap-2 p-20">
                        <div className="text-sm text-gray-500">
                          Unable to support playground on this request. Please
                          contact support at (support@helicone.ai) and we can be
                          sure to add support for it. Or if you feel inclined,
                          you can submit a PR to add support for it.
                        </div>
                      </div>
                    );
                }
              })()}
            </ScrollArea>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={20}>
            <ScrollArea className="w-full h-full">
              <div className="flex flex-col h-full">
                {error ? (
                  <div className="p-4 text-red-500 dark:text-red-400 text-sm">
                    {error}
                  </div>
                ) : !response ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FlaskConicalIcon className="w-8 h-8 text-slate-400" />
                      <p className="text-sm text-slate-500">No response yet</p>
                      <p className="text-xs text-slate-400">
                        Click Run to generate a response
                      </p>
                    </div>
                  </div>
                ) : isStreaming ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                      <p className="text-sm text-slate-500">
                        Generating response...
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-end p-2 border-b border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newMessageMappedResponse =
                            openAIMessageToHeliconeMessage(
                              JSON.parse(response)
                            );

                          if (response && mappedContent) {
                            const newMappedContent = {
                              ...mappedContent,
                              schema: {
                                ...mappedContent.schema,
                                request: {
                                  ...mappedContent.schema.request,
                                  messages: [
                                    ...(mappedContent.schema.request.messages ??
                                      []),
                                    {
                                      ...newMessageMappedResponse,
                                      id: `msg-${uuidv4()}`,
                                    },
                                  ],
                                },
                              },
                            };
                            setMappedContent(newMappedContent);
                          }
                        }}
                      >
                        Add to Chat
                      </Button>
                    </div>
                    <Chat
                      mappedRequest={mappedContent as MappedLLMRequest}
                      mode="PLAYGROUND_OUTPUT"
                    />
                  </>
                )}
              </div>
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  );
};

export default PlaygroundPage;

/** Types and Function for using finetuned models in Playground, Experiments Page */
interface PlaygroundPageProps {
  showNewButton?: boolean;
  requestId?: string;
}
