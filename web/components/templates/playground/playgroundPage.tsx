import { TooltipLegacy as Tooltip } from "@/components/ui/tooltipLegacy";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
// import { MultiSelect, MultiSelectItem } from "@tremor/react";
// import Image from "next/image";
// import {
//   ChatCompletionCreateParams,
//   ChatCompletionTool,
// } from "openai/resources";
import { useMemo, useRef, useState } from "react";
import { playgroundModels as PLAYGROUND_MODELS } from "@helicone-package/cost/providers/mappings";
import AuthHeader from "../../shared/authHeader";
import useNotification from "../../shared/notification/useNotification";
import { heliconeRequestToMappedContent } from "@helicone-package/llm-mapper/utils/getMappedContent";
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
import { JsonRenderer } from "../requests/components/chatComponent/single/JsonRenderer";
import findBestMatch from "string-similarity-js";

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

  const defaultMappedContent = useMemo(() => {
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
      return mappedContent;
    }
    return DEFAULT_EMPTY_CHAT;
  }, [requestData, isRequestLoading]);

  console.log(defaultMappedContent, selectedModel);

  const [tools, setTools] = useState<Tool[]>(
    mappedContent?.schema.request.tools ?? []
  );
  const [response, setResponse] = useState<string>("");

  const { setNotification } = useNotification();
  const abortController = useRef<AbortController | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  const onRun = async () => {
    if (!mappedContent) {
      setNotification("No mapped content", "error");
      return;
    }
    console.log(
      "request",
      JSON.stringify(mappedContent.schema.request, null, 2)
    );
    const openaiRequest = openaiChatMapper.toExternal(
      mappedContent.schema.request
    );

    console.log(openaiRequest);

    try {
      abortController.current = new AbortController();

      try {
        const stream = await generateStream({
          ...openaiRequest,
          model: selectedModel,
          signal: abortController.current.signal,
        } as any);

        await processStream(
          stream,
          {
            initialState: { content: "", reasoning: "", calls: "" },
            onUpdate: (result) => {
              setResponse(result.content);
            },
          },
          abortController.current.signal
        );
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error:", error);
          setNotification(error.message, "error");
        }
      } finally {
        setIsStreaming(false);
        abortController.current = null;
      }
    } catch (error) {
      setNotification("Failed to save prompt state", "error");
      setIsStreaming(false);
    }
  };

  return (
    <main className="h-screen flex flex-col w-full animate-fade-in">
      <AuthHeader
        title={"Playground"}
        actions={<Button onClick={onRun}>Run</Button>}
      />
      <div className="flex justify-between w-full h-full gap-8 min-h-[80vh] border-t border-border">
        <div className="flex w-full h-full ">
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
                    <div className="text-sm text-gray-500 ">
                      Unable to support playground on this request. Please
                      contact support at (support@helicone.ai) and we can be
                      sure to add support for it. Or if you feel inclined, you
                      can submit a PR to add support for it.
                    </div>
                  </div>
                );
            }
          })()}
        </div>
        <div className="flex flex-col w-full max-w-[16rem] h-full space-y-8 ">
          <div className="flex flex-col gap-2 p-20">
            <JsonRenderer data={response} showCopyButton={false} />
          </div>
          <div className="flex flex-col space-y-2 w-full">
            <div className="flex flex-row w-full space-x-1 items-center">
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                Models
              </p>
            </div>
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
          </div>
        </div>
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
