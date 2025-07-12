import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { generateStream } from "@/lib/api/llm/generate-stream";
import { processStream } from "@/lib/api/llm/process-stream";
import { useGetRequestWithBodies } from "@/services/hooks/requests";
import { openAIMessageToHeliconeMessage } from "@helicone-package/llm-mapper/mappers/openai/chat";
import {
  openaiChatMapper,
  OpenAIChatRequest,
} from "@helicone-package/llm-mapper/mappers/openai/chat-v2";
import {
  MappedLLMRequest,
  Provider,
  Tool,
} from "@helicone-package/llm-mapper/types";
import { heliconeRequestToMappedContent } from "@helicone-package/llm-mapper/utils/getMappedContent";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import findBestMatch from "string-similarity-js";
import { v4 as uuidv4 } from "uuid";
import useNotification from "../../shared/notification/useNotification";
import PlaygroundMessagesPanel from "./components/PlaygroundMessagesPanel";
import PlaygroundResponsePanel from "./components/PlaygroundResponsePanel";
import PlaygroundVariablesPanel from "./components/PlaygroundVariablesPanel";
import { OPENROUTER_MODEL_MAP } from "./new/openRouterModelMap";
import FoldedHeader from "@/components/shared/FoldedHeader";
import { Small } from "@/components/ui/typography";
import { ModelParameters } from "@/lib/api/llm/generate";
import { useCreatePrompt, useUpdatePrompt, useGetPromptVersionWithBody } from "@/services/hooks/prompts";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useFeatureFlag } from "@/services/hooks/admin";
import { HeliconeTemplateManager } from "@helicone-package/prompts/templates";
import { TemplateVariable } from "@helicone-package/prompts/types";
import { Message } from "@helicone-package/llm-mapper/types";
import { useVariableColorMapStore } from "@/store/features/playground/variableColorMap";

export const DEFAULT_EMPTY_CHAT: MappedLLMRequest = {
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
  model: "gpt-4.1-mini",
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
    promptCacheWriteTokens: 0,
    promptCacheReadTokens: 0,
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
      tool_choice: undefined,
      model: "gpt-4o",
      temperature: undefined,
      tools: undefined,
      response_format: { type: "text" },
      max_tokens: undefined,
      top_p: undefined,
      frequency_penalty: undefined,
      presence_penalty: undefined,
      stop: [],
    },
  },
};

const convertMappedLLMRequestToOpenAIChatRequest = (
  mappedContent: MappedLLMRequest, tools: Tool[],
  modelParameters: ModelParameters,
  selectedModel: string,
  responseFormat: { type: string, json_schema?: string }
): OpenAIChatRequest => {
  const openaiRequest = openaiChatMapper.toExternal({
    ...mappedContent.schema.request,
    tools: tools && tools.length > 0 ? tools : undefined,
  } as any);

  const promptBody = {
    ...openaiRequest,
    ...Object.fromEntries(
      Object.entries(modelParameters).map(([key, value]) => [
        key,
        value === null ? undefined : value,
      ])
    ),
    model: selectedModel,
    response_format:
      responseFormat?.type === "json_schema"
        ? {
            type: "json_schema",
            json_schema: responseFormat.json_schema,
          }
        : undefined,
  };

  return promptBody;
}

const convertOpenAIChatRequestToMappedLLMRequest = (openaiRequest: OpenAIChatRequest): MappedLLMRequest => {
  const internalRequest = openaiChatMapper.toInternal(openaiRequest);

  return {
    _type: "openai-chat",
    id: "",
    preview: {
      request: internalRequest.messages?.[0]?.content ?? "",
      response: "",
      concatenatedMessages: internalRequest.messages || [],
    },
    model: openaiRequest.model || "gpt-4.1-mini",
    raw: {
      request: openaiRequest,
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
      promptCacheWriteTokens: 0,
      promptCacheReadTokens: 0,
    },
    schema: {
      request: {
        ...internalRequest,
        messages:
          internalRequest.messages?.map((message) => ({
            ...message,
            id: uuidv4(),
          })) ?? [],
      },
    },
  };
};

const PlaygroundPage = (props: PlaygroundPageProps) => {
  const { requestId, promptVersionId } = props;
  const { setNotification } = useNotification();
  const router = useRouter();
  const organization = useOrg();
  const { data: hasAccessToPrompts } = useFeatureFlag(
    "prompts_2025",
    organization?.currentOrg?.id ?? "",
  );
  const { initializeColorMap } = useVariableColorMapStore();

  useEffect(() => {
    if (requestId && promptVersionId) {
      setNotification(
        "Cannot load request and prompt at the same time.",
        "error"
      );
      router.push("/playground");
      return;
    }
  }, [requestId, promptVersionId, setNotification, router]);

  const { data: requestData, isLoading: isRequestLoading } =
    useGetRequestWithBodies(requestId ?? "");

  const { data: promptVersionData, isLoading: isPromptVersionLoading } =
    useGetPromptVersionWithBody(promptVersionId);

  const [selectedModel, setSelectedModel] = useState<string>(
    "openai/gpt-4.1-mini"
  );

  const [defaultContent, setDefaultContent] = useState<MappedLLMRequest | null>(
    null
  );

  const [mappedContent, setMappedContent] = useState<MappedLLMRequest | null>(
    null
  );

  useEffect(() => {
    if (!requestId && !promptVersionId) {
      setMappedContent(DEFAULT_EMPTY_CHAT);
      setDefaultContent(DEFAULT_EMPTY_CHAT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, promptVersionId]);

  useEffect(() => {
    if (
      promptVersionData &&
      promptVersionData.promptBody &&
      !isPromptVersionLoading
    ) {
      const convertedContent = convertOpenAIChatRequestToMappedLLMRequest(
        promptVersionData.promptBody
      );

      const model = promptVersionData.promptBody.model;
      if (model && model in OPENROUTER_MODEL_MAP) {
        setSelectedModel(OPENROUTER_MODEL_MAP[model.split("/")[1]]);
      } else if (model) {
        const similarities = Object.keys(OPENROUTER_MODEL_MAP).map((m) => ({
          target: m,
          similarity: findBestMatch(model, m),
        }));

        const closestMatch = similarities.reduce((best, current) =>
          current.similarity > best.similarity ? current : best
        );
        setSelectedModel(OPENROUTER_MODEL_MAP[closestMatch.target]);
      }

      onUpdateMappedContent(convertedContent);
      setDefaultContent(convertedContent);
      setTools(convertedContent.schema.request.tools ?? []);

      setModelParameters({
        temperature: promptVersionData.promptBody.temperature,
        max_tokens: promptVersionData.promptBody.max_tokens,
        top_p: promptVersionData.promptBody.top_p,
        frequency_penalty: promptVersionData.promptBody.frequency_penalty,
        presence_penalty: promptVersionData.promptBody.presence_penalty,
        stop: promptVersionData.promptBody.stop
          ? Array.isArray(promptVersionData.promptBody.stop)
            ? promptVersionData.promptBody.stop.join(",")
            : promptVersionData.promptBody.stop
          : undefined,
      });

      if (promptVersionData.promptBody.response_format) {
        setResponseFormat({
          type: promptVersionData.promptBody.response_format.type || "text",
          json_schema: promptVersionData.promptBody.response_format.json_schema,
        });
      }
    }
  }, [promptVersionData, isPromptVersionLoading]);

  useEffect(() => {
    if (promptVersionData && promptVersionData.promptBody && !isPromptVersionLoading) {
      const convertedContent = convertOpenAIChatRequestToMappedLLMRequest(promptVersionData.promptBody);
      
      const model = promptVersionData.promptBody.model;
      if (model && model in OPENROUTER_MODEL_MAP) {
        setSelectedModel(OPENROUTER_MODEL_MAP[model.split("/")[1]]);
      } else if (model) {
        const similarities = Object.keys(OPENROUTER_MODEL_MAP).map((m) => ({
          target: m,
          similarity: findBestMatch(model, m),
        }));

        const closestMatch = similarities.reduce((best, current) =>
          current.similarity > best.similarity ? current : best
        );
        setSelectedModel(OPENROUTER_MODEL_MAP[closestMatch.target]);
      }

      setMappedContent(convertedContent);
      setDefaultContent(convertedContent);
      setTools(convertedContent.schema.request.tools ?? []);
      
      setModelParameters({
        temperature: promptVersionData.promptBody.temperature,
        max_tokens: promptVersionData.promptBody.max_tokens,
        top_p: promptVersionData.promptBody.top_p,
        frequency_penalty: promptVersionData.promptBody.frequency_penalty,
        presence_penalty: promptVersionData.promptBody.presence_penalty,
        stop: promptVersionData.promptBody.stop
          ? Array.isArray(promptVersionData.promptBody.stop)
            ? promptVersionData.promptBody.stop.join(",")
            : promptVersionData.promptBody.stop
          : undefined,
      });

      if (promptVersionData.promptBody.response_format) {
        setResponseFormat({
          type: promptVersionData.promptBody.response_format.type || "text",
          json_schema: promptVersionData.promptBody.response_format.json_schema,
        });
      }
    }
  }, [promptVersionData, isPromptVersionLoading]);

  const [tools, setTools] = useState<Tool[]>([]);

  const [modelParameters, setModelParameters] = useState<ModelParameters>({
    temperature: undefined,
    max_tokens: undefined,
    top_p: undefined,
    frequency_penalty: undefined,
    presence_penalty: undefined,
    stop: undefined,
  });

  const [responseFormat, setResponseFormat] = useState<{
    type: string;
    json_schema?: string;
  }>({
    type: "text",
    json_schema: undefined,
  });

  const [templateVariables, setTemplateVariables] = useState<Map<string, TemplateVariable>>(new Map());
  const [substitutionValues, setSubstitutionValues] = useState<Map<string, string>>(new Map());
  const [templatedMessages, setTemplatedMessages] = useState<Message[]>([]);

  const onUpdateSubstitutionValue = (name: string, value: string) => {
    setSubstitutionValues(prev => {
      const next = new Map(prev);
      next.set(name, value);
      return next;
    });
  };

  useMemo(() => {
    if (!requestId) {
      setTools([]);
      setModelParameters({
        temperature: undefined,
        max_tokens: undefined,
        top_p: undefined,
        frequency_penalty: undefined,
        presence_penalty: undefined,
        stop: undefined,
      });
      setMappedContent(DEFAULT_EMPTY_CHAT);
      setDefaultContent(DEFAULT_EMPTY_CHAT);
      return;
    }
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
      let contentWithIds = {
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
        // nothing in local storage
        setMappedContent(contentWithIds);
        setTools(contentWithIds?.schema.request.tools ?? []);
        setModelParameters({
          temperature: contentWithIds.schema.request.temperature,
          max_tokens: contentWithIds.schema.request.max_tokens,
          top_p: contentWithIds.schema.request.top_p,
          frequency_penalty: contentWithIds.schema.request.frequency_penalty,
          presence_penalty: contentWithIds.schema.request.presence_penalty,
          stop: contentWithIds.schema.request.stop
            ? Array.isArray(contentWithIds.schema.request.stop)
              ? contentWithIds.schema.request.stop.join(",")
              : contentWithIds.schema.request.stop
            : undefined,
        });
      } else {
        setTools(mappedContent?.schema.request.tools ?? []);
        setModelParameters({
          temperature: mappedContent?.schema.request.temperature,
          max_tokens: mappedContent?.schema.request.max_tokens,
          top_p: mappedContent?.schema.request.top_p,
          frequency_penalty: mappedContent?.schema.request.frequency_penalty,
          presence_penalty: mappedContent?.schema.request.presence_penalty,
          stop: mappedContent?.schema.request.stop
            ? Array.isArray(mappedContent?.schema.request.stop)
              ? mappedContent?.schema.request.stop.join(",")
              : mappedContent?.schema.request.stop
            : undefined,
        });
        setSelectedModel(mappedContent.model);
      }
      setDefaultContent(contentWithIds);

      return mappedContent;
    }
    return DEFAULT_EMPTY_CHAT;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, requestData, isRequestLoading]);

  const [response, setResponse] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const [isStreaming, setIsLoading] = useState<boolean>(false);
  const [useAIGateway, setUseAIGateway] = useState<boolean>(false);

  useEffect(() => {
    if (response) {
      const parsedResponse = JSON.parse(response);
      const newMessageMappedResponse =
        openAIMessageToHeliconeMessage(parsedResponse);
      if (!mappedContent) {
        return;
      }
      // TODO: be able to remove the @ts-ignore
      // @ts-ignore
      setMappedContent((prev: MappedLLMRequest) => ({
        ...prev,
        raw: {
          ...prev.raw,
          response: {
            ...prev.raw.response,
            messages: [parsedResponse],
          },
        },
        schema: {
          ...prev.schema,
          response: {
            ...(prev.schema.response ?? {}),
            messages: [newMessageMappedResponse],
          },
        },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const createPromptMutation = useCreatePrompt();
  const updatePromptMutation = useUpdatePrompt();

  const onCreatePrompt = async (
    tags: string[],
    promptName: string,
  ) => {
    if (!mappedContent) {
      setNotification("No mapped content", "error");
      return;
    }
    const promptBody = convertMappedLLMRequestToOpenAIChatRequest(mappedContent, tools, modelParameters, selectedModel, responseFormat);
    try {
      const result = await createPromptMutation.mutateAsync({
        body: {
          name: promptName,
          tags: tags,
          promptBody: promptBody as OpenAIChatRequest,
        },
      });

      if (result.data?.versionId) {
        router.push(`/playground?promptVersionId=${result.data.versionId}`);
        setNotification(
          `Prompt created successfully!`,
          "success"
        );
      }
    } catch (error) {
      console.error("Failed to save prompt:", error);
      setNotification("Failed to save prompt", "error");
    }
  };

  const onSavePrompt = async (
    newMajorVersion: boolean,
    setAsProduction: boolean,
    commitMessage: string,
  ) => {
    if (!mappedContent) {
      setNotification("No mapped content", "error");
      return;
    }

    if (!promptVersionData?.promptVersion || !promptVersionData?.prompt) {
      setNotification("No prompt version data available", "error");
      return;
    }

    const promptBody = convertMappedLLMRequestToOpenAIChatRequest(
      mappedContent, 
      tools, 
      modelParameters, 
      selectedModel, 
      responseFormat
    );

    try {
      const result = await updatePromptMutation.mutateAsync({
        body: {
          promptId: promptVersionData.prompt.id,
          promptVersionId: promptVersionData.promptVersion.id,
          newMajorVersion,
          setAsProduction,
          commitMessage,
          promptBody,
        },
      });

      if (result.data?.id) {
        router.push(`/playground?promptVersionId=${result.data.id}`);
        
        setNotification(
          `Prompt version saved successfully!`,
          "success"
        );
      }
    } catch (error) {
      console.error("Failed to save prompt version:", error);
      setNotification("Failed to save prompt version", "error");
    }
  }

  const createTemplatedMessages = (messages: Message[]): { hasSubstitutionFailure: boolean, templatedMessages: Message[] } => {
    const templatedMessages: Message[] = [];
    let hasSubstitutionFailure = false;

    if (!messages) return { hasSubstitutionFailure, templatedMessages };

    for (const message of messages) {
      if (message._type === "contentArray" && message.contentArray) {
        const processedContentArray = message.contentArray.map(item => {
          if (item._type === "message" && item.content) {
            const substituted = HeliconeTemplateManager.substituteVariables(
              item.content,
              Object.fromEntries(substitutionValues)
            );
            if (!substituted.success) hasSubstitutionFailure = true;
            return { 
              ...item,
              content: substituted.success ? substituted.result : item.content 
            };
          }
          return item;
        });
        templatedMessages.push({
          ...message,
          contentArray: processedContentArray
        });
      } else if (message.content) {
        const substituted = HeliconeTemplateManager.substituteVariables(
          message.content,
          Object.fromEntries(substitutionValues)
        );
        if (!substituted.success) hasSubstitutionFailure = true;
        templatedMessages.push({
          ...message,
          content: substituted.success ? substituted.result : message.content
        });
      } else {
        templatedMessages.push(message);
      } 
    }
    
    return { hasSubstitutionFailure, templatedMessages };
  };

  const onUpdateMappedContent = (newMappedContent: MappedLLMRequest | null) => {
    if (!newMappedContent) {
      setMappedContent(null);
      return;
    }

    const messages = newMappedContent.schema.request.messages;
    const allVariables = new Map<string, TemplateVariable>();

    const processContent = (content: string) => {
      const variables = HeliconeTemplateManager.extractVariables(content);
      variables.forEach((variable: TemplateVariable) => allVariables.set(variable.name, variable));
      return variables;
    };

    if (messages) {
      for (const message of messages) {
        if (message._type === "contentArray" && message.contentArray) {
          message.contentArray.forEach(item => {
            if (item._type === "message" && item.content) {
              processContent(item.content);
            }
          });
        } else if (message.content) {
          processContent(message.content);
        }
      }
    }

    initializeColorMap(Array.from(allVariables.keys()));
    setTemplateVariables(allVariables);
    setMappedContent(newMappedContent);
  };

  const onRun = async () => {
    if (!mappedContent) {
      setNotification("No mapped content", "error");
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      abortController.current = new AbortController();

      try {
        const { hasSubstitutionFailure, templatedMessages } = createTemplatedMessages(mappedContent.schema.request.messages || []);
        if (hasSubstitutionFailure) {
          setNotification("Improper template values!", "error");
          return;
        }

        const templatedContent = {
          ...mappedContent,
          schema: {
            ...mappedContent.schema,
            request: {
              ...mappedContent.schema.request,
              messages: templatedMessages
            }
          }
        };

        const openaiRequest = convertMappedLLMRequestToOpenAIChatRequest(
          templatedContent,
          tools,
          modelParameters,
          selectedModel,
          responseFormat
        );

        const stream = await generateStream({
          ...openaiRequest,
          signal: abortController.current.signal,
          useAIGateway,
        } as any);

        const result = await processStream(
          stream,
          {
            initialState: {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappedContent]);

  const handleToolsChange = (newTools: Tool[]) => {
    setTools(newTools);
    if (!mappedContent) {
      return;
    }
    onUpdateMappedContent({
      ...mappedContent,
      schema: {
        ...mappedContent.schema,
        request: { ...mappedContent.schema.request, tools: newTools }
      }
    });
  };

  const handleSelectedModelChange = (newModel: string) => {
    setSelectedModel(newModel);
    if (!mappedContent) {
      return;
    }
    onUpdateMappedContent({
      ...mappedContent,
      model: newModel,
      schema: {
        ...mappedContent.schema,
        request: { ...mappedContent.schema.request, model: newModel },
      },
    });
  };

  return (
    <main className="h-screen flex flex-col w-full animate-fade-in">
      <FoldedHeader
        showFold={false}
        leftSection={
          <div className="flex items-center gap-3">
            <Small className="font-bold text-gray-500 dark:text-slate-300">
              Playground
            </Small>
            {hasAccessToPrompts && promptVersionData?.prompt && promptVersionData?.promptVersion && (
              <>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-2">
                  <Small className="font-bold text-gray-500 dark:text-slate-300">
                    {promptVersionData.prompt.name.length > 30
                      ? promptVersionData.prompt.name.substring(0, 27) + "..."
                      : promptVersionData.prompt.name}
                  </Small>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                    {promptVersionData.promptVersion.minor_version === 0
                      ? `v${promptVersionData.promptVersion.major_version}`
                      : `v${promptVersionData.promptVersion.major_version}.${promptVersionData.promptVersion.minor_version}`}
                  </span>
                </div>
              </>
            )}
          </div>
        }
      />
      <div className="flex flex-col w-full h-full min-h-[80vh] border-t border-border">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            className="flex w-full h-full"
            defaultSize={70}
            minSize={30}
          >
            {isPromptVersionLoading || isRequestLoading ? (
              <LoadingAnimation />
            ) : (
            <PlaygroundMessagesPanel
              mappedContent={mappedContent}
              defaultContent={defaultContent}
              setMappedContent={onUpdateMappedContent}
              selectedModel={selectedModel}
              setSelectedModel={handleSelectedModelChange}
              tools={tools}
              setTools={handleToolsChange}
              responseFormat={responseFormat}
              setResponseFormat={setResponseFormat}
              modelParameters={modelParameters}
              setModelParameters={setModelParameters}
              promptVersionId={promptVersionId}
              onCreatePrompt={onCreatePrompt}
              onSavePrompt={onSavePrompt}
              onRun={onRun}
              useAIGateway={useAIGateway}
                setUseAIGateway={setUseAIGateway}
              />
            )}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={20}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={60} minSize={30}>
                <PlaygroundResponsePanel
                  mappedContent={mappedContent}
                  setMappedContent={onUpdateMappedContent}
                  error={error}
                  response={response}
                  isStreaming={isStreaming}
                />
              </ResizablePanel>
              {hasAccessToPrompts && (
                <>
                <ResizableHandle />
                <ResizablePanel defaultSize={40} minSize={20}>
                  <PlaygroundVariablesPanel 
                    variables={templateVariables}
                    onUpdateValue={onUpdateSubstitutionValue}
                    values={substitutionValues}
                  />
                </ResizablePanel>
              </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  );
};

export default PlaygroundPage;

/** Types and Function for using finetuned models in Playground, Experiments Page */
interface PlaygroundPageProps {
  requestId?: string;
  promptVersionId?: string;
}
