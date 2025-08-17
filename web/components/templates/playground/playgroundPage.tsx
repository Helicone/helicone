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
import {
  useCreatePrompt,
  usePushPromptVersion,
  useGetPromptVersion,
  useGetPromptInputs,
} from "@/services/hooks/prompts";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import { useOrg } from "@/components/layout/org/organizationContext";

import { HeliconeTemplateManager } from "@helicone-package/prompts/templates";
import { TemplateVariable } from "@helicone-package/prompts/types";
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
  const { setToolHandler } = useHeliconeAgent();
  const { requestId, promptVersionId } = props;
  const { setNotification } = useNotification();
  const router = useRouter();
  const organization = useOrg();
  const { initializeColorMap } = useVariableColorMapStore();

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

  const [selectedModel, setSelectedModel] = useState<string>(
    "openai/gpt-4.1-mini",
  );

  const [defaultContent, setDefaultContent] = useState<MappedLLMRequest | null>(
    null,
  );

  const [mappedContent, setMappedContent] = useState<MappedLLMRequest | null>(
    null,
  );

  useEffect(() => {
    setToolHandler("get-messages", () => {
      return {
        success: true,
        message: JSON.stringify(mappedContent?.schema.request.messages ?? []),
      };
    });

    setToolHandler(
      "edit-playground-message",
      async (args: {
        message_index: number;
        content_array_index: number;
        text: string;
      }) => {
        if (!mappedContent) {
          return {
            success: false,
            message: "No mapped content available",
          };
        }

        const message =
          mappedContent.schema.request.messages?.[args.message_index];
        if (!message) {
          return {
            success: false,
            message: "Message not found",
          };
        }

        const updatedMappedContent = { ...mappedContent };
        const updatedMessages = [
          ...(mappedContent.schema.request.messages || []),
        ];
        const updatedMessage = { ...message };
        if (message._type === "contentArray") {
          if (
            !message.contentArray ||
            args.content_array_index >= message.contentArray.length
          ) {
            return {
              success: false,
              message: "Content array index out of bounds",
            };
          }

          const updatedContentArray = [...message.contentArray];
          updatedContentArray[args.content_array_index] = {
            _type: "message",
            role: message.role,
            content: args.text,
          } as Message;

          updatedMessage.contentArray = updatedContentArray;
        } else {
          updatedMessage.content = args.text;
        }

        updatedMessages[args.message_index] = updatedMessage;
        updatedMappedContent.schema = {
          ...updatedMappedContent.schema,
          request: {
            ...updatedMappedContent.schema.request,
            messages: updatedMessages,
          },
        };

        setMappedContent(updatedMappedContent);
        return {
          success: true,
          message: "Message edited successfully",
        };
      },
    );
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
      if (model && model in OPENROUTER_MODEL_MAP) {
        setSelectedModel(OPENROUTER_MODEL_MAP[model.split("/")[1]]);
      } else if (model) {
        const similarities = Object.keys(OPENROUTER_MODEL_MAP).map((m) => ({
          target: m,
          similarity: findBestMatch(model, m),
        }));

        const closestMatch = similarities.reduce((best, current) =>
          current.similarity > best.similarity ? current : best,
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
  const [variableInputs, setVariableInputs] = useLocalStorage<
    Record<string, VariableInput>
  >("variableInputs", {});

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
      if (requestData.data.model in OPENROUTER_MODEL_MAP) {
        setSelectedModel(OPENROUTER_MODEL_MAP[requestData.data.model]);
      } else {
        const similarities = Object.keys(OPENROUTER_MODEL_MAP).map((m) => ({
          target: m,
          similarity: findBestMatch(requestData.data.model, m),
        }));

        const closestMatch = similarities.reduce((best, current) =>
          current.similarity > best.similarity ? current : best,
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

  // Watch changes to mappedContent, to update template variables
  useEffect(() => {
    const allVariables = new Map<string, TemplateVariable>();

    const processContent = (content: string) => {
      const variables = HeliconeTemplateManager.extractVariables(content);
      variables.forEach((variable: TemplateVariable) =>
        allVariables.set(variable.name, variable),
      );
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

    initializeColorMap(Array.from(allVariables.keys()));
    setTemplateVariables(allVariables);
  }, [mappedContent]);

  const createTemplatedMessages = (
    substitutionValues: Record<string, any>,
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
          abortController.current.signal,
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
                useAIGateway={useAIGateway}
                setUseAIGateway={setUseAIGateway}
                error={error}
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
}
