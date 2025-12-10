import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { generateStream } from "@/lib/api/llm/generate-stream";
import { processStream } from "@/lib/api/llm/process-stream";
import { useGetRequestWithBodies } from "@/services/hooks/requests";
import { useModelRegistry } from "@/services/hooks/useModelRegistry";
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
import { v4 as uuidv4 } from "uuid";
import useNotification from "../../shared/notification/useNotification";
import PlaygroundMessagesPanel from "./components/PlaygroundMessagesPanel";
import PlaygroundResponsePanel from "./components/PlaygroundResponsePanel";
import PlaygroundVariablesPanel from "./components/PlaygroundVariablesPanel";
import FoldedHeader from "@/components/shared/FoldedHeader";
import { Small } from "@/components/ui/typography";
import { ModelParameters } from "@/lib/api/llm/generate";
import {
  useCreatePrompt,
  usePushPromptVersion,
  useGetPromptVersion,
  useGetPromptInputs,
} from "@/services/hooks/prompts";
import { $JAWN_API } from "@/lib/clients/jawn";
import LoadingAnimation from "@/components/shared/loadingAnimation";

import { HeliconeTemplateManager } from "@helicone-package/prompts/templates";
import {
  TemplateVariable,
  PromptPartialVariable,
} from "@helicone-package/prompts/types";
import { Message } from "@helicone-package/llm-mapper/types";
import { useVariableColorMapStore } from "@/store/features/playground/variableColorMap";
import { ResponseFormat, ResponseFormatType, VariableInput } from "./types";
import { useLocalStorage } from "@/services/hooks/localStorage";
import Link from "next/link";
import EnvironmentPill from "@/components/templates/prompts2025/EnvironmentPill";
import PromptVersionPill from "@/components/templates/prompts2025/PromptVersionPill";
import { useHeliconeAgent } from "@/components/templates/agent/HeliconeAgentContext";

export const DEFAULT_EMPTY_CHAT: MappedLLMRequest = {
  _type: "openai-chat",
  id: "",
  preview: {
    request:
      "You are a helpful AI assistant.\n\nYou are speaking to {{ hc:name:string }}",
    response: "",
    concatenatedMessages: [
      {
        _type: "message",
        role: "system",
        content:
          "You are a helpful AI assistant.\n\nYou are speaking to {{ hc:name:string }}",
      },
    ],
  },
  model: "gpt-4o-mini",
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
          content:
            "You are a helpful AI assistant.\n\nYou are speaking to {{ hc:name:string }}",
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
      reasoning_effort: undefined,
      verbosity: undefined,
    },
  },
};

const convertMappedLLMRequestToOpenAIChatRequest = (
  mappedContent: MappedLLMRequest,
  tools: Tool[],
  modelParameters: ModelParameters,
  selectedModel: string,
  responseFormat: ResponseFormat,
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
      ]),
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
};

const convertOpenAIChatRequestToMappedLLMRequest = (
  openaiRequest: OpenAIChatRequest,
): MappedLLMRequest => {
  const internalRequest = openaiChatMapper.toInternal(openaiRequest);

  return {
    _type: "openai-chat",
    id: "",
    preview: {
      request: internalRequest.messages?.[0]?.content ?? "",
      response: "",
      concatenatedMessages: internalRequest.messages || [],
    },
    model: openaiRequest.model || "gpt-4o-mini",
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
  const { setToolHandler } = useHeliconeAgent();
  const { requestId, promptVersionId, createPrompt } = props;
  const { setNotification } = useNotification();
  const router = useRouter();
  const { initializeColorMap } = useVariableColorMapStore();

  // Model registry for validating supported models
  const { data: playgroundModels, isLoading: modelsLoading } =
    useModelRegistry();

  // Track unsupported model warning
  const [unsupportedModelWarning, setUnsupportedModelWarning] = useState<{
    originalModel: string;
    fallbackModel: string;
  } | null>(null);

  useEffect(() => {
    if (requestId && promptVersionId) {
      setNotification(
        "Cannot load request and prompt at the same time.",
        "error",
      );
      router.push("/playground");
      return;
    }
  }, [requestId, promptVersionId, setNotification, router]);

  const { data: requestData, isLoading: isRequestLoading } =
    useGetRequestWithBodies(requestId ?? "");

  const requestPromptId = useMemo(
    () => requestData?.data?.prompt_id ?? null,
    [requestData?.data?.prompt_id],
  );
  const requestPromptVersionId = useMemo(
    () => requestData?.data?.prompt_version ?? null,
    [requestData?.data?.prompt_version],
  );

  const { data: promptVersionData, isLoading: isPromptVersionLoading } =
    useGetPromptVersion(promptVersionId || requestPromptVersionId || undefined);

  const promptInputsQuery = useGetPromptInputs(
    requestPromptId || "",
    requestPromptVersionId || "",
    requestId || "",
  );

  const [selectedModel, setSelectedModel] = useState<string>("gpt-4o-mini");

  // Track the original model from request/prompt before validation
  const [originalModelFromData, setOriginalModelFromData] = useState<
    string | null
  >(null);

  // Default fallback model
  const DEFAULT_FALLBACK_MODEL = "gpt-4o-mini";

  // Effect to validate model when registry loads or original model changes
  useEffect(() => {
    if (modelsLoading || !playgroundModels || playgroundModels.length === 0) {
      return;
    }

    // If we have an original model from data that needs validation
    if (originalModelFromData) {
      const isModelSupported = playgroundModels.some(
        (m) => m.id === originalModelFromData,
      );

      if (!isModelSupported) {
        setUnsupportedModelWarning({
          originalModel: originalModelFromData,
          fallbackModel: DEFAULT_FALLBACK_MODEL,
        });
        setSelectedModel(DEFAULT_FALLBACK_MODEL);
      } else {
        setUnsupportedModelWarning(null);
        setSelectedModel(originalModelFromData);
      }
      // Clear the original model after processing
      setOriginalModelFromData(null);
    }
  }, [modelsLoading, playgroundModels, originalModelFromData]);

  const [defaultContent, setDefaultContent] = useState<MappedLLMRequest | null>(
    null,
  );

  const [mappedContent, setMappedContent] = useState<MappedLLMRequest | null>(
    null,
  );

  useEffect(() => {
    setToolHandler("playground-get_messages", () => {
      return {
        success: true,
        message: JSON.stringify(mappedContent?.schema.request.messages ?? []),
      };
    });

    setToolHandler(
      "playground-edit_messages",
      async (args: { messages: Message[] }) => {
        if (!mappedContent) {
          return {
            success: false,
            message: "No mapped content available",
          };
        }

        try {
          if (!Array.isArray(args.messages)) {
            return {
              success: false,
              message: "Messages must be an array",
            };
          }

          const processedMessages = args.messages.map((message, index) => {
            const processedMessage = { ...message };
            processedMessage.id = `msg-${uuidv4()}`;

            if (
              processedMessage._type === "message" &&
              !processedMessage.role
            ) {
              processedMessage.role = index === 0 ? "system" : "user";
            }

            return processedMessage;
          });

          const updatedMappedContent = {
            ...mappedContent,
            schema: {
              ...mappedContent.schema,
              request: {
                ...mappedContent.schema.request,
                messages: processedMessages,
              },
            },
          };

          setMappedContent(updatedMappedContent);

          return {
            success: true,
            message: `Successfully updated ${processedMessages.length} messages`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error updating messages: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappedContent]);

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
        promptVersionData.promptBody,
      );

      const model = promptVersionData.promptBody.model;
      // Store original model for validation when registry loads
      if (model) {
        setOriginalModelFromData(model);
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
        reasoning_effort: promptVersionData.promptBody.reasoning_effort,
        verbosity: promptVersionData.promptBody.verbosity,
      });

      const storedResponseFormat = convertedContent?.schema.request
        .response_format as ResponseFormat;
      if (storedResponseFormat) {
        setResponseFormat({
          type: "json_schema" as ResponseFormatType,
          json_schema: storedResponseFormat.json_schema,
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
    reasoning_effort: undefined,
    verbosity: undefined,
  });

  const [responseFormat, setResponseFormat] = useState<ResponseFormat>({
    type: "text",
    json_schema: undefined,
  });

  const [templateVariables, setTemplateVariables] = useState<
    Map<string, TemplateVariable>
  >(new Map());
  const [promptBodyCache, setPromptBodyCache] = useState<
    Map<string, OpenAIChatRequest>
  >(new Map());
  const [variableInputs, setVariableInputs] = useLocalStorage<
    Record<string, VariableInput>
  >("variableInputs", {});
  const [promptPartialInputs, setPromptPartialInputs] = useLocalStorage<
    Record<string, string>
  >("promptPartialInputs", {});

  // Initial check for if we are loading a request that is associated with a prompt
  // then we should be editing that prompt instead.
  useEffect(() => {
    if (
      requestId &&
      requestData?.data &&
      !isRequestLoading &&
      requestPromptVersionId &&
      !promptInputsQuery.isLoading
    ) {
      if (promptInputsQuery.data) {
        const convertedInputs: Record<string, VariableInput> = {};
        for (const [key, value] of Object.entries(
          promptInputsQuery.data.inputs,
        )) {
          convertedInputs[key] = {
            isObject: typeof value === "object" && value !== null,
            value:
              typeof value === "object" && value !== null
                ? JSON.stringify(value)
                : String(value),
          };
        }

        setVariableInputs(convertedInputs);
      }

      router.push(`/playground?promptVersionId=${requestPromptVersionId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    requestId,
    requestData,
    isRequestLoading,
    requestPromptVersionId,
    promptInputsQuery.data,
    promptInputsQuery.isLoading,
    router,
  ]);

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
        reasoning_effort: undefined,
        verbosity: undefined,
      });
      setMappedContent(DEFAULT_EMPTY_CHAT);
      setDefaultContent(DEFAULT_EMPTY_CHAT);
      return;
    }
    if (requestData?.data && !isRequestLoading && !requestPromptVersionId) {
      const model = requestData.data.model;
      // Store original model for validation when registry loads
      if (model) {
        setOriginalModelFromData(model);
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
          reasoning_effort: contentWithIds.schema.request.reasoning_effort,
          verbosity: contentWithIds.schema.request.verbosity,
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
          reasoning_effort: mappedContent?.schema.request.reasoning_effort,
          verbosity: mappedContent?.schema.request.verbosity,
        });
        setSelectedModel(mappedContent.model);
      }
      setDefaultContent(contentWithIds);

      return mappedContent;
    }
    return DEFAULT_EMPTY_CHAT;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, requestData, isRequestLoading, requestPromptVersionId]);

  const [response, setResponse] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const [isStreaming, setIsLoading] = useState<boolean>(false);

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
  const pushPromptVersionMutation = usePushPromptVersion();

  const onCreatePrompt = async (tags: string[], promptName: string) => {
    if (!mappedContent) {
      setNotification("No mapped content", "error");
      return;
    }
    const promptBody = convertMappedLLMRequestToOpenAIChatRequest(
      mappedContent,
      tools,
      modelParameters,
      selectedModel,
      responseFormat,
    );
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
        setNotification(`Prompt created successfully!`, "success");
      }
    } catch (error) {
      console.error("Failed to save prompt:", error);
      setNotification("Failed to save prompt", "error");
    }
  };

  const onSavePrompt = async (
    newMajorVersion: boolean,
    environment: string | undefined,
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
      responseFormat,
    );

    try {
      const result = await pushPromptVersionMutation.mutateAsync({
        body: {
          promptId: promptVersionData.prompt.id,
          promptVersionId: promptVersionData.promptVersion.id,
          newMajorVersion,
          environment,
          commitMessage,
          promptBody,
        },
      });

      if (result.data?.id) {
        router.push(`/playground?promptVersionId=${result.data.id}`);

        setNotification(`Prompt version saved successfully!`, "success");
      }
    } catch (error) {
      console.error("Failed to save prompt version:", error);
      setNotification("Failed to save prompt version", "error");
    }
  };

  // Watch changes to mappedContent, to update template variables and prompt partials
  useEffect(() => {
    const allVariables = new Map<string, TemplateVariable>();
    const allPromptPartials: PromptPartialVariable[] = [];
    const seenPartials = new Set<string>();

    const processContent = (content: string) => {
      const variables = HeliconeTemplateManager.extractVariables(content);
      variables.forEach((variable: TemplateVariable) =>
        allVariables.set(variable.name, variable),
      );

      // Also extract prompt partials
      const partials =
        HeliconeTemplateManager.extractPromptPartialVariables(content);
      partials.forEach((partial) => {
        if (!seenPartials.has(partial.raw)) {
          seenPartials.add(partial.raw);
          allPromptPartials.push(partial);
        }
      });

      return variables;
    };

    if (mappedContent) {
      const messages = mappedContent.schema.request.messages;
      if (messages) {
        for (const message of messages) {
          if (message._type === "contentArray" && message.contentArray) {
            message.contentArray.forEach((item) => {
              if (item._type === "message" && item.content) {
                processContent(item.content);
              }
            });
          } else if (message.content) {
            processContent(message.content);
          }
        }
      }

      const responseFormat = mappedContent.schema.request.response_format;
      if (responseFormat && responseFormat.type === "json_schema") {
        if (responseFormat.json_schema) {
          const jsonSchemaString = JSON.stringify(responseFormat.json_schema);
          processContent(jsonSchemaString);
        }
      }

      const tools = mappedContent.schema.request.tools;
      if (tools) {
        const toolsString = JSON.stringify(tools);
        processContent(toolsString);
      }
    }

    setTemplateVariables(allVariables);

    // Fetch prompt bodies for partials and extract variables from specific message indices
    const fetchPartialVariables = async () => {
      const partialVariablesMap = new Map<string, TemplateVariable>();
      const newCacheEntries = new Map<string, OpenAIChatRequest>();

      for (const partial of allPromptPartials) {
        const cacheKey = partial.environment
          ? `${partial.prompt_id}:${partial.index}:${partial.environment}`
          : `${partial.prompt_id}:${partial.index}`;

        // check session cache for prompt body of the partial first
        let promptBody = promptBodyCache.get(cacheKey);

        if (!promptBody) {
          try {
            // Fetch the prompt version
            let versionResult;
            if (partial.environment) {
              versionResult = await $JAWN_API.POST(
                "/v1/prompt-2025/query/environment-version",
                {
                  body: {
                    promptId: partial.prompt_id,
                    environment: partial.environment,
                  },
                },
              );
            } else {
              versionResult = await $JAWN_API.POST(
                "/v1/prompt-2025/query/production-version",
                {
                  body: {
                    promptId: partial.prompt_id,
                  },
                },
              );
            }

            if (versionResult.error || !versionResult.data?.data?.s3_url) {
              continue;
            }

            // Fetch the prompt body
            const s3Response = await fetch(versionResult.data.data.s3_url);
            if (!s3Response.ok) {
              continue;
            }

            promptBody = (await s3Response.json()) as OpenAIChatRequest;

            newCacheEntries.set(cacheKey, promptBody);
          } catch (error) {
            console.error(
              `Error fetching prompt body for partial ${partial.raw}:`,
              error,
            );
            continue;
          }
        }

        if (!promptBody) {
          continue;
        }

        const messages = promptBody.messages || [];

        if (partial.index >= 0 && partial.index < messages.length) {
          const targetMessage = messages[partial.index];

          if (typeof targetMessage.content === "string") {
            const variables = HeliconeTemplateManager.extractVariables(
              targetMessage.content,
            );
            variables.forEach((variable) => {
              const key = variable.name;
              if (!partialVariablesMap.has(key)) {
                partialVariablesMap.set(key, {
                  ...variable,
                  from_prompt_partial: true,
                });
              }
            });
          } else if (Array.isArray(targetMessage.content)) {
            for (const contentPart of targetMessage.content) {
              if (contentPart.type === "text" && contentPart.text) {
                const variables = HeliconeTemplateManager.extractVariables(
                  contentPart.text,
                );
                variables.forEach((variable) => {
                  const key = variable.name;
                  if (!partialVariablesMap.has(key)) {
                    partialVariablesMap.set(key, {
                      ...variable,
                      from_prompt_partial: true,
                    });
                  }
                });
              }
            }
          }
        }
      }

      // update session cache with new entries
      if (newCacheEntries.size > 0) {
        setPromptBodyCache((prevCache) => {
          const updatedCache = new Map(prevCache);
          newCacheEntries.forEach((body, key) => {
            updatedCache.set(key, body);
          });
          return updatedCache;
        });
      }

      // Populate promptPartialInputs from cached prompt bodies
      const updatedPartialInputs: Record<string, string> = {};
      for (const partial of allPromptPartials) {
        const cacheKey = partial.environment
          ? `${partial.prompt_id}:${partial.index}:${partial.environment}`
          : `${partial.prompt_id}:${partial.index}`;

        const promptBody =
          promptBodyCache.get(cacheKey) || newCacheEntries.get(cacheKey);

        if (
          promptBody &&
          promptBody.messages &&
          partial.index >= 0 &&
          partial.index < promptBody.messages.length
        ) {
          const targetMessage = promptBody.messages[partial.index];
          let substitutionValue = "";

          if (typeof targetMessage.content === "string") {
            substitutionValue = targetMessage.content;
          } else if (Array.isArray(targetMessage.content)) {
            substitutionValue = targetMessage.content
              .map((contentPart) => {
                if (contentPart.type === "text" && contentPart.text) {
                  return contentPart.text;
                }
                return "";
              })
              .filter((text) => text.length > 0)
              .join(" ");
          }

          if (substitutionValue) {
            updatedPartialInputs[partial.raw] = substitutionValue;
          }
        }
      }

      if (Object.keys(updatedPartialInputs).length > 0) {
        setPromptPartialInputs({
          ...promptPartialInputs,
          ...updatedPartialInputs,
        });
      }

      partialVariablesMap.forEach((variable, key) => {
        if (!allVariables.has(key)) {
          allVariables.set(key, variable);
        }
      });

      initializeColorMap(Array.from(allVariables.keys()));
      setTemplateVariables(new Map(allVariables));
    };

    if (allPromptPartials.length > 0) {
      fetchPartialVariables();
    } else {
      initializeColorMap(Array.from(allVariables.keys()));
      setTemplateVariables(allVariables);
    }
  }, [mappedContent, modelParameters, selectedModel, responseFormat, tools]);

  const createTemplatedMessages = (
    substitutionValues: Record<string, any>,
    promptPartialInputs: Record<string, any>,
    messages: Message[],
  ): { hasSubstitutionFailure: boolean; templatedMessages: Message[] } => {
    const templatedMessages: Message[] = [];
    let hasSubstitutionFailure = false;

    for (const message of messages) {
      if (message._type === "contentArray" && message.contentArray) {
        const processedContentArray = message.contentArray.map((item) => {
          if (item._type === "message" && item.content) {
            const substituted = HeliconeTemplateManager.substituteVariables(
              item.content,
              substitutionValues,
              promptPartialInputs,
            );
            if (!substituted.success) hasSubstitutionFailure = true;
            return {
              ...item,
              content: substituted.success ? substituted.result : item.content,
            };
          }
          return item;
        });
        templatedMessages.push({
          ...message,
          contentArray: processedContentArray,
        });
      } else if (message.content) {
        const substituted = HeliconeTemplateManager.substituteVariables(
          message.content,
          substitutionValues,
          promptPartialInputs,
        );
        if (!substituted.success) hasSubstitutionFailure = true;
        templatedMessages.push({
          ...message,
          content: substituted.success ? substituted.result : message.content,
        });
      } else {
        templatedMessages.push(message);
      }
    }

    return { hasSubstitutionFailure, templatedMessages };
  };

  const createTemplatedMappedContent = (
    mappedContent: MappedLLMRequest,
  ): MappedLLMRequest => {
    try {
      const substitutionValues = Object.fromEntries(
        Object.entries(variableInputs).map(([name, { isObject, value }]) => {
          if (isObject) {
            try {
              return [name, JSON.parse(value)];
            } catch (error) {
              throw new Error(`Invalid JSON for variable "${name}": ${error}`);
            }
          }
          return [name, value];
        }),
      );

      const { hasSubstitutionFailure, templatedMessages } =
        createTemplatedMessages(
          substitutionValues,
          promptPartialInputs,
          mappedContent.schema.request.messages || [],
        );
      if (hasSubstitutionFailure) {
        setNotification("Improper template values!", "error");
        return mappedContent;
      }
      const substituted = HeliconeTemplateManager.substituteVariablesJSON(
        mappedContent.schema.request.response_format as ResponseFormat,
        substitutionValues,
      );
      if (!substituted.success) {
        setNotification("Improper template values!", "error");
      }

      const substitutedTools = HeliconeTemplateManager.substituteVariablesJSON(
        mappedContent.schema.request.tools as Tool[],
        substitutionValues,
      );
      if (!substitutedTools.success) {
        setNotification("Improper template values!", "error");
      }

      return {
        ...mappedContent,
        schema: {
          ...mappedContent.schema,
          request: {
            ...mappedContent.schema.request,
            messages: templatedMessages,
            response_format: substituted.success
              ? (substituted.result as ResponseFormat)
              : mappedContent.schema.request.response_format,
            tools: substitutedTools.success
              ? (substitutedTools.result as Tool[])
              : mappedContent.schema.request.tools,
          },
        },
      };
    } catch (error) {
      setNotification("Improper template values!", "error");
      return mappedContent;
    }
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
        const templatedMappedContent =
          createTemplatedMappedContent(mappedContent);

        const openaiRequest = convertMappedLLMRequestToOpenAIChatRequest(
          templatedMappedContent,
          templatedMappedContent.schema.request.tools as Tool[],
          modelParameters,
          selectedModel,
          templatedMappedContent.schema.request
            .response_format as ResponseFormat,
        );

        const stream = await generateStream({
          ...openaiRequest,
          signal: abortController.current.signal,
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
          abortController.current.signal,
        );

        if (result && result.error) {
          if (typeof result.error.message === "string") {
            try {
              const error = JSON.parse(result.error.message);
              if (error?.error) {
                setError(error.error);
              } else {
                setError(error.message);
              }
            } catch (error) {
              setError(result.error.message);
            }
          }
          const error = result.error.message || result.error?.error?.message;
          if (error.includes("Insufficient credits")) {
            setError(
              "Insufficient credits. Please add credits to continue using the playground.",
            );
          } else {
            setError(error);
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            setError("Request was cancelled");
            setNotification("Request was cancelled", "error");
          } else {
            console.error("Error:", error);
            setError(
              error.message ||
                "An error occurred while generating the response",
            );
            setNotification(
              error.message ||
                "An error occurred while generating the response",
              "error",
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

  const handleResponseFormatChange = (newResponseFormat: ResponseFormat) => {
    setResponseFormat(newResponseFormat);
    if (!mappedContent) {
      return;
    }
    setMappedContent({
      ...mappedContent,
      schema: {
        ...mappedContent.schema,
        request: {
          ...mappedContent.schema.request,
          response_format: newResponseFormat,
        },
      },
    });
  };

  const handleToolsChange = (newTools: Tool[]) => {
    setTools(newTools);
    if (!mappedContent) {
      return;
    }
    setMappedContent({
      ...mappedContent,
      schema: {
        ...mappedContent.schema,
        request: { ...mappedContent.schema.request, tools: newTools },
      },
    });
  };

  const handleSelectedModelChange = (newModel: string) => {
    setSelectedModel(newModel);
    if (!mappedContent) {
      return;
    }
    setMappedContent({
      ...mappedContent,
      model: newModel,
      schema: {
        ...mappedContent.schema,
        request: { ...mappedContent.schema.request, model: newModel },
      },
    });
  };

  return (
    <main className="flex h-screen w-full animate-fade-in flex-col">
      <FoldedHeader
        showFold={false}
        leftSection={
          <div className="flex items-center gap-3">
            <Link href="/playground">
              <Small className="font-bold text-gray-500 dark:text-slate-300">
                Playground
              </Small>
            </Link>
            {promptVersionData?.prompt && promptVersionData?.promptVersion && (
              <>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <Small className="font-bold text-gray-500 dark:text-slate-300">
                    {promptVersionData.prompt.name.length > 30
                      ? promptVersionData.prompt.name.substring(0, 27) + "..."
                      : promptVersionData.prompt.name}
                  </Small>
                  <PromptVersionPill
                    majorVersion={promptVersionData.promptVersion.major_version}
                    minorVersion={promptVersionData.promptVersion.minor_version}
                  />
                  {promptVersionData.promptVersion.environment && (
                    <EnvironmentPill
                      environment={promptVersionData.promptVersion.environment}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        }
      />
      <div className="flex h-full min-h-[80vh] w-full flex-col border-t border-border">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            className="flex h-full w-full"
            defaultSize={70}
            minSize={30}
          >
            {isPromptVersionLoading || isRequestLoading ? (
              <LoadingAnimation />
            ) : (
              <PlaygroundMessagesPanel
                mappedContent={mappedContent}
                defaultContent={defaultContent}
                setMappedContent={setMappedContent}
                selectedModel={selectedModel}
                setSelectedModel={handleSelectedModelChange}
                tools={tools}
                setTools={handleToolsChange}
                responseFormat={responseFormat}
                setResponseFormat={handleResponseFormatChange}
                modelParameters={modelParameters}
                setModelParameters={setModelParameters}
                promptVersionId={promptVersionId}
                onCreatePrompt={onCreatePrompt}
                onSavePrompt={onSavePrompt}
                onRun={onRun}
                error={error}
                isLoading={isStreaming}
                createPrompt={createPrompt}
                unsupportedModelWarning={unsupportedModelWarning}
                onDismissUnsupportedModelWarning={() =>
                  setUnsupportedModelWarning(null)
                }
              />
            )}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={20}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={60} minSize={30}>
                <PlaygroundResponsePanel
                  mappedContent={mappedContent}
                  setMappedContent={setMappedContent}
                  error={error}
                  response={response}
                  isStreaming={isStreaming}
                />
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={40} minSize={20}>
                <PlaygroundVariablesPanel
                  variables={templateVariables}
                  onUpdateValue={(name, { isObject, value }) => {
                    setVariableInputs({
                      ...variableInputs,
                      [name]: { isObject, value },
                    });
                  }}
                  values={variableInputs}
                />
              </ResizablePanel>
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
  createPrompt?: boolean;
}
