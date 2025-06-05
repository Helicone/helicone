import { useMemo, useRef, useState } from "react";
import { playgroundModels as PLAYGROUND_MODELS } from "@helicone-package/cost/providers/mappings";
import AuthHeader from "../../shared/authHeader";
import useNotification from "../../shared/notification/useNotification";
import {
  getMappedContent,
  heliconeRequestToMappedContent,
} from "@helicone-package/llm-mapper/utils/getMappedContent";
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
import { Check, ChevronsUpDownIcon } from "lucide-react";
import Chat from "../requests/components/Chat";
import { openaiChatMapper } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";
import findBestMatch from "string-similarity-js";
import ToolsConfigurationModal from "./components/ToolsConfigurationModal";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { ResizablePanelGroup } from "@/components/ui/resizable";
import MarkdownEditor from "@/components/shared/markdownEditor";
import { openAIMessageToHeliconeMessage } from "@helicone-package/llm-mapper/mappers/openai/chat";

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
    },
  },
};

const PlaygroundPage = (props: PlaygroundPageProps) => {
  const { requestId } = props;

  const [modelListOpen, setModelListOpen] = useState<boolean>(false);

  const { data: requestData, isLoading: isRequestLoading } =
    useGetRequestWithBodies(requestId ?? "");

  const [selectedModel, setSelectedModel] = useState<string>("gpt-3.5-turbo");

  const [mappedContent, setMappedContent] =
    useState<MappedLLMRequest>(DEFAULT_EMPTY_CHAT);

  const [tools, setTools] = useState<Tool[]>([]);

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
      const mappedContent = heliconeRequestToMappedContent(requestData.data);
      setMappedContent(mappedContent);
      console.log("mappedContent", mappedContent);
      setTools(mappedContent?.schema.request.tools ?? []);
      return mappedContent;
    }
    return DEFAULT_EMPTY_CHAT;
  }, [requestData, isRequestLoading]);

  const [response, setResponse] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { setNotification } = useNotification();
  const abortController = useRef<AbortController | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  const onRun = async () => {
    setNotification("Running...", "info");
    if (!mappedContent) {
      setNotification("No mapped content", "error");
      return;
    }
    const openaiRequest = openaiChatMapper.toExternal({
      ...mappedContent.schema.request,
      tools,
    });

    try {
      setError(null);
      setIsStreaming(true);
      abortController.current = new AbortController();

      console.log("openaiRequest", openaiRequest);

      try {
        const stream = await generateStream({
          ...openaiRequest,
          model: selectedModel,
          signal: abortController.current.signal,
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
        console.log("finally");
        setIsStreaming(false);
        abortController.current = null;
      }
    } catch (error) {
      setNotification("Failed to save prompt state", "error");
      setIsStreaming(false);
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  };

  return (
    <main className="h-screen flex flex-col w-full animate-fade-in">
      <AuthHeader
        title={"Playground"}
        actions={<Button onClick={onRun}>Run</Button>}
      />
      <div className="flex flex-col w-full h-full min-h-[80vh] border-t border-border">
        <div className="flex justify-between items-center px-4 py-2 border-b border-border bg-sidebar-background">
          <div className="flex items-center space-x-4">
            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
              Models
            </p>
            <Popover open={modelListOpen} onOpenChange={setModelListOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={modelListOpen}
                  className="w-[200px] justify-between"
                >
                  <span className="truncate max-w-[150px]">
                    {selectedModel || "Select model..."}
                  </span>
                  <ChevronsUpDownIcon className="opacity-50" />
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
                              currentValue === selectedModel ? "" : currentValue
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
            <ToolsConfigurationModal tools={tools} onToolsChange={setTools} />
          </div>
        </div>
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            className="flex w-full h-full"
            defaultSize={70}
            minSize={30}
          >
            {(() => {
              switch (mappedContent?._type) {
                case "openai-chat":
                case "anthropic-chat":
                case "gemini-chat":
                  return (
                    <Chat
                      mappedRequest={mappedContent as MappedLLMRequest}
                      playgroundMode
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
                        sure to add support for it. Or if you feel inclined, you
                        can submit a PR to add support for it.
                      </div>
                    </div>
                  );
              }
            })()}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={20}>
            <div className="flex flex-col h-full bg-white dark:bg-black">
              {error ? (
                <div className="p-4 text-red-500 dark:text-red-400 text-sm">
                  {error}
                </div>
              ) : (
                <>
                  <div className="flex justify-end p-2 border-b border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newMessageMappedResponse =
                          openAIMessageToHeliconeMessage(JSON.parse(response));

                        if (response) {
                          const newMappedContent = {
                            ...mappedContent,
                            schema: {
                              ...mappedContent.schema,
                              request: {
                                ...mappedContent.schema.request,
                                messages: [
                                  ...(mappedContent.schema.request.messages ??
                                    []),
                                  newMessageMappedResponse,
                                ],
                              },
                            },
                          };
                          setMappedContent(newMappedContent);
                        }
                        console.log(
                          "newMessageMappedResponse",
                          newMessageMappedResponse
                        );
                      }}
                    >
                      Add to Chat
                    </Button>
                  </div>
                  <MarkdownEditor
                    language="markdown"
                    text={response}
                    placeholder="Output"
                    setText={() => {}}
                    disabled
                    className="flex-1"
                  />
                </>
              )}
            </div>
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
