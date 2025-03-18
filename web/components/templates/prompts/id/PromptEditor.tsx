import { FreeTierLimitBanner } from "@/components/shared/FreeTierLimitBanner";
import { FreeTierLimitWrapper } from "@/components/shared/FreeTierLimitWrapper";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import useNotification from "@/components/shared/notification/useNotification";
import AutoImprove from "@/components/shared/prompts/AutoImprove";
import VariablesPanel from "@/components/shared/prompts/InputsPanel";
import MessagesPanel from "@/components/shared/prompts/MessagesPanel";
import ParametersPanel from "@/components/shared/prompts/ParametersPanel";
import ResponsePanel from "@/components/shared/prompts/ResponsePanel";
import ToolPanel from "@/components/shared/prompts/ToolsPanel";
import UniversalPopup from "@/components/shared/universal/Popup";
import CustomScrollbar, {
  CustomScrollbarRef,
} from "@/components/shared/universal/Scrollbar";
import VersionSelector from "@/components/shared/universal/VersionSelector";
import { UpgradeProDialog } from "@/components/templates/organization/plan/upgradeProDialog";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { generateStream } from "@/lib/api/llm/generate-stream";
import { processStream } from "@/lib/api/llm/process-stream";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { usePromptRunsStore } from "@/lib/stores/promptRunsStore";
import { openaiChatMapper } from "@/packages/llm-mapper/mappers/openai/chat-v2";
import {
  heliconeRequestToMappedContent,
  MAPPERS,
} from "@/packages/llm-mapper/utils/getMappedContent";
import { getMapperType } from "@/packages/llm-mapper/utils/getMapperType";
import autoImprovePrompt from "@/prompts/auto-improve";
import { PromptState, StateInputs } from "@/types/prompt-state";
import {
  $system,
  $user,
  findClosestModel,
  findClosestProvider,
} from "@/utils/generate";
import {
  isLastMessageUser,
  isPrefillSupported,
  parseImprovedMessages,
  removeMessage,
} from "@/utils/messages";
import { toKebabCase } from "@/utils/strings";
import {
  deduplicateVariables,
  extractVariables,
  heliconeToTemplateTags,
  isValidVariableName,
  templateToHeliconeTags,
} from "@/utils/variables";
import { autoFillInputs } from "@helicone/prompts";
import { FlaskConicalIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { LLMRequestBody, Message } from "packages/llm-mapper/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdKeyboardReturn } from "react-icons/md";
import {
  PiBrainBold,
  PiCaretLeftBold,
  PiChartBarBold,
  PiCommandBold,
  PiPlayBold,
  PiSpinnerGapBold,
  PiStopBold,
} from "react-icons/pi";
import {
  useCreatePrompt,
  usePrompt,
  usePrompts,
  usePromptVersions,
} from "../../../../services/hooks/prompts/prompts";
import { useGetRequestWithBodies } from "../../../../services/hooks/requests";
import DeployDialog from "./DeployDialog";
import { useExperiment } from "./hooks";
import PromptMetricsTab from "./PromptMetricsTab";

type EditorMode =
  | "fromCode"
  | "fromEditor"
  | "fromRequest"
  | "fromPlayground"
  | null;
interface PromptEditorProps {
  promptId?: string; // Prompt Id Mode
  requestId?: string; // Request Id Mode
  basePrompt?: {
    body: LLMRequestBody;
    metadata: {
      provider: string;
      isProduction: boolean;
      inputs?: Record<string, string>;
    };
  }; // Playground Mode
}
export default function PromptEditor({
  promptId,
  requestId,
  basePrompt,
}: PromptEditorProps) {
  /* -------------------------------------------------------------------------- */
  /*                                    State                                   */
  /* -------------------------------------------------------------------------- */
  const [state, setState] = useState<PromptState | null>(null);
  const [isAutoImproveOpen, setIsAutoImproveOpen] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const messagesScrollRef = useRef<CustomScrollbarRef>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  /* -------------------------------------------------------------------------- */
  /*                                    Hooks                                   */
  /* -------------------------------------------------------------------------- */
  // - Router
  const router = useRouter();
  // - Jawn Client
  const jawnClient = useJawnClient();
  // - Request Data
  const { data: requestData, isLoading: isRequestLoading } =
    useGetRequestWithBodies(requestId ?? "");
  // - Prompt Table
  const {
    prompt: promptData,
    isLoading: isPromptLoading,
    refetch: refetchPrompt,
  } = usePrompt(promptId ?? "");
  // - Prompt Versions Table
  const {
    prompts: promptVersionsData,
    isLoading: isVersionsLoading,
    refetch: refetchPromptVersions,
  } = usePromptVersions(promptId ?? "");
  // - Notifications
  const { setNotification } = useNotification();
  // - Experiment
  const { newFromPromptVersion } = useExperiment();
  // - Create Prompt
  const { createPrompt, isCreating: isCreatingPrompt } = useCreatePrompt();

  // FREE TIER LIMITS
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const {
    playgroundRunCount,
    promptRunCount,
    incrementPlaygroundRun,
    incrementPromptRun,
  } = usePromptRunsStore();
  // - Prompts Count
  const { prompts: promptsData } = usePrompts();
  const promptCount = promptsData?.length || 0;
  const {
    canCreate: withinPromptsLimit,
    upgradeMessage: promptsLimitUpgradeMessage,
  } = useFeatureLimit("prompts", promptCount);
  // - Prompt Versions Count
  const versionCount = promptVersionsData?.length ?? 0;
  const { canCreate: withinVersionsLimit } = useFeatureLimit(
    "prompts",
    versionCount,
    "versions"
  );
  // - Prompt Runs
  const {
    canCreate: withinPrompRunsLimit,
    freeLimit: maxPromptRuns,
    upgradeMessage: promptRunsUpgradeMessage,
    hasAccess: hasPromptAccess,
  } = useFeatureLimit("prompts", promptRunCount, "runs");
  // - Playground Runs
  const {
    canCreate: withinPlaygroundRunsLimit,
    freeLimit: maxPlaygroundRuns,
    upgradeMessage: playgroundRunsUpgradeMessage,
    hasAccess: hasPlaygroundAccess,
  } = useFeatureLimit("prompts", playgroundRunCount, "playground_runs");

  /* -------------------------------------------------------------------------- */
  /*                                 Validation                                 */
  /* -------------------------------------------------------------------------- */
  // - Centralized prompt mode validation
  const editorMode = useMemo<EditorMode>(() => {
    // If we're still loading data, return null
    if (
      (promptId && (isPromptLoading || isVersionsLoading)) ||
      (requestId && isRequestLoading)
    ) {
      return null;
    }

    // Check for each mode in priority order
    if (requestId) {
      return "fromRequest";
    } else if (basePrompt) {
      return "fromPlayground";
    } else if (promptId) {
      // Check if we have metadata to determine if it's from code or editor
      if (promptData?.metadata?.createdFromUi === true) {
        return "fromEditor";
      } else {
        return "fromCode";
      }
    }

    // Fallback (should never happen with proper props)
    return null;
  }, [
    promptId,
    requestId,
    basePrompt,
    promptData,
    isPromptLoading,
    isVersionsLoading,
    isRequestLoading,
  ]);
  // - Can Run
  const canRun = useMemo(() => {
    // For OPENAI, ANTHROPIC, and GOOGLE provider, just check if any message has non-empty content
    if (
      state?.parameters?.provider === "OPENAI" ||
      state?.parameters?.provider === "ANTHROPIC" ||
      state?.parameters?.provider === "GOOGLE_GEMINI" ||
      state?.parameters?.provider === "GOOGLE_VERTEXAI"
    ) {
      return (
        state?.messages.some(
          (m) =>
            typeof m !== "string" &&
            (typeof m.content === "string" ? m.content.trim().length > 0 : true)
        ) ?? false
      );
    }

    // For other providers, check if there's at least one user message with non-empty content
    else
      return (
        state?.messages.some(
          (m) =>
            typeof m !== "string" &&
            m.role === "user" &&
            (typeof m.content === "string" ? m.content.trim().length > 0 : true)
        ) ?? false
      );
  }, [state?.messages, state?.parameters?.provider]);

  /* -------------------------------------------------------------------------- */
  /*                                 Callbacks                                  */
  /* -------------------------------------------------------------------------- */
  // - Loads Version Data for modes fromCode and fromEditor
  const loadVersionData = useCallback(
    (ver: any) => {
      if (!ver) return;

      console.log(`Loading version data:`, ver);

      let templateData: any = {};
      let metadata: {
        provider?: string;
        isProduction?: boolean;
        inputs?: Record<string, string>;
        evals?: any[];
        structure?: any;
      } = {};

      let stateMessages: Message[] = [];
      let inputs: StateInputs[] = [];
      let masterVersion: number | undefined;

      // Get version template and metadata
      const versionTemplate = ver.helicone_template;
      const versionMetadata = ver.metadata;

      // Process based on editor mode
      if (editorMode === "fromCode") {
        // For imported from code: use mapper to transform the template
        const mapperType = getMapperType({
          model: versionTemplate.model,
          provider: versionMetadata.provider || "OPENAI",
        });
        const mapper = MAPPERS[mapperType];
        const mappedResult = mapper({
          request: versionTemplate,
          response: {
            choices: [],
            model: versionTemplate.model,
          },
          statusCode: 200,
          model: versionTemplate.model,
        });

        templateData = mappedResult.schema.request;
        metadata = versionMetadata;
      } else {
        // For UI-created prompts: parse template and metadata
        templateData =
          typeof versionTemplate === "string"
            ? JSON.parse(versionTemplate)
            : versionTemplate || {};
        metadata =
          typeof versionMetadata === "string"
            ? JSON.parse(versionMetadata)
            : versionMetadata || {};
      }

      // Determine master version (production version)
      masterVersion =
        metadata?.isProduction === true
          ? ver.major_version
          : promptVersionsData?.find(
              (v) => (v.metadata as { isProduction?: boolean })?.isProduction
            )?.major_version ?? ver.major_version;

      // Process variables and inputs
      // 1. First collect all variables from metadata inputs
      inputs = Object.entries(metadata?.inputs || {}).map(([name, value]) => ({
        name,
        value: value as string,
        isValid: isValidVariableName(name),
      }));

      // 2. Extract messages and variables from content
      stateMessages = (templateData.messages ?? []) as Message[];
      stateMessages.forEach((msg) => {
        const vars = extractVariables(msg.content || "", "helicone");
        vars.forEach((v) => {
          inputs.push({
            name: v.name,
            value: metadata?.inputs?.[v.name] ?? v.value ?? "",
            isValid: v.isValid ?? true,
          });
        });
      });

      // 3. Add message auto-inputs
      stateMessages.forEach((msg) => {
        msg.idx !== undefined &&
          inputs.push({
            name: `message_${msg.idx}`,
            value: "",
            isValid: true,
            idx: msg.idx,
          });
      });

      // 4. Deduplicate variables
      inputs = deduplicateVariables(inputs);

      // Find closest provider and model
      const provider = findClosestProvider(
        templateData.provider || metadata?.provider || "OPENAI"
      );
      const model = findClosestModel(provider, templateData.model || "gpt-4");

      // Update state with processed data
      setState({
        promptId: promptId,
        masterVersion,
        version: ver.major_version,
        versionId: ver.id,

        messages: stateMessages,
        parameters: {
          provider: provider,
          model: model,
          temperature: templateData.temperature ?? undefined,
          tools: templateData.tools ?? undefined,
          max_tokens: templateData.max_tokens ?? undefined,
          reasoning_effort: templateData.reasoning_effort ?? undefined,
          stop: templateData.stop ?? undefined,
        },
        inputs,
        evals: metadata?.evals ?? [],
        structure: metadata?.structure ?? undefined,

        isDirty: false,
      });
    },
    [promptId, promptVersionsData, editorMode]
  );
  // - Update State
  const updateState = useCallback(
    (
      updates:
        | Partial<PromptState>
        | ((prev: PromptState | null) => Partial<PromptState>),
      markDirty: boolean = true
    ) => {
      setState((prev) => {
        if (!prev) return null;

        // Handle function or direct updates
        const newUpdates =
          typeof updates === "function" ? updates(prev) : updates;

        // Return updated state with isDirty flag set appropriately
        return {
          ...prev,
          ...newUpdates,
          isDirty: markDirty ? true : prev.isDirty,
        };
      });
    },
    []
  );
  // - Message Change
  const handleMessageChange = useCallback(
    (index: number, content: string) => {
      updateState((prev) => {
        if (!prev) return {};

        // Replace the message content at the changed index
        const updatedMessages = prev.messages.map((msg, i) => {
          if (i !== index) return msg;
          return { ...msg, content };
        });

        // Extract variables from all updatedMessages, preserving existing variable data, and deduplicating
        const existingVariables = prev.inputs || [];
        console.log("Existing variables:", existingVariables);

        const extractedVars = updatedMessages.flatMap((msg) => {
          const vars = extractVariables(msg.content || "", "helicone");
          console.log("Extracted vars from message:", msg.content, vars);
          return vars;
        });
        console.log("All extracted vars:", extractedVars);

        const updatedVariables = deduplicateVariables(
          extractedVars.map((newVar) => {
            const existingVar = existingVariables.find(
              (v) => v.name === newVar.name
            );
            console.log(
              "Processing var:",
              newVar.name,
              "existing:",
              existingVar,
              "new:",
              newVar
            );
            return existingVar || newVar;
          })
        );
        console.log("Final updated variables:", updatedVariables);

        return {
          messages: updatedMessages,
          inputs: updatedVariables,
        };
      });
    },
    [updateState]
  );
  // - Remove Message
  const handleRemoveMessage = useCallback(
    (index: number) => {
      updateState({
        messages: removeMessage({
          isPrefillSupported: isPrefillSupported(state!.parameters.provider),
          messages: state!.messages,
          index,
        }),
      });
    },
    [state, updateState]
  );
  // - Create Variable
  const handleVariableCreate = useCallback(
    (newVariable: StateInputs) => {
      updateState((prev) => {
        if (!prev) return {};
        const currentVars = [...(prev.inputs || [])];
        const existingIndex = currentVars.findIndex(
          (v) => v.name === newVariable.name
        );

        if (existingIndex >= 0) {
          currentVars[existingIndex] = {
            ...currentVars[existingIndex],
            ...newVariable,
          };
        } else {
          currentVars.push(newVariable);
        }

        return { inputs: currentVars };
      });
    },
    [updateState]
  );
  // - Change Variable
  const handleVariableChange = useCallback(
    (index: number, value: string) => {
      updateState((prev) => {
        if (!prev?.inputs) return {};

        const updatedVariables = [...prev.inputs];
        const variable = updatedVariables[index];
        updatedVariables[index] = { ...variable, value };

        // If this variable has an idx, also update the corresponding message
        if (variable.idx !== undefined) {
          let parsedValue: Message;
          try {
            parsedValue = JSON.parse(value);
          } catch (e) {
            return { inputs: updatedVariables };
          }

          const updatedMessages = prev.messages.map((msg) => {
            if (msg.idx === variable.idx) {
              return {
                ...msg,
                role: parsedValue.role,
                content: parsedValue.content,
              };
            }
            return msg;
          });

          return {
            inputs: updatedVariables,
            messages: updatedMessages,
          };
        }

        return { inputs: updatedVariables };
      }, false);
    },
    [updateState]
  );
  // - Promote Version
  const handleVersionPromote = useCallback(
    async (version: any) => {
      if (!version) return;

      const currentProductionVersion = promptVersionsData?.find(
        (v) => (v.metadata as { isProduction?: boolean })?.isProduction
      );

      try {
        const result = await jawnClient.POST(
          "/v1/prompt/version/{promptVersionId}/promote",
          {
            params: {
              path: {
                promptVersionId: version.id,
              },
            },
            body: {
              previousProductionVersionId:
                currentProductionVersion?.id ?? version.id,
            },
          }
        );

        if (result.error) {
          setNotification("Failed to promote version", "error");
          return;
        }

        await refetchPromptVersions();
        // Update state to reflect the new master version
        setState((prev) =>
          prev
            ? {
                ...prev,
                masterVersion: version.major_version,
              }
            : null
        );
        setNotification(
          `Promoted version ${version.major_version} to production.`,
          "success"
        );
      } catch (error) {
        console.error("Error promoting version:", error);
        setNotification("Failed to promote version", "error");
      }
    },
    [jawnClient, promptVersionsData, refetchPromptVersions, setNotification]
  );
  // - Handle ID Edit
  const handleIdEdit = useCallback(
    async (newId: string) => {
      const kebabId = toKebabCase(newId);
      if (kebabId !== promptId) {
        const result = await jawnClient.PATCH(
          "/v1/prompt/{promptId}/user-defined-id",
          {
            params: {
              path: {
                promptId: promptData?.id || "",
              },
            },
            body: {
              userDefinedId: kebabId,
            },
          }
        );

        if (result.error) {
          setNotification("Failed to update prompt ID.", "error");
          return;
        }

        setNotification(`Updated prompt ID to ${kebabId}.`, "success");
        await refetchPrompt();
      }
    },
    [promptId, jawnClient, promptData?.id, refetchPrompt, setNotification]
  );
  // - Save &/Or Run
  const handleSaveAndRun = useCallback(async () => {
    if (!state || !canRun) return;

    // 1. ABORT: If already streaming
    if (isStreaming) {
      abortController.current?.abort();
      setIsStreaming(false);
      return;
    }

    // Check limits based on mode
    if (editorMode === "fromPlayground") {
      if (!withinPlaygroundRunsLimit) {
        setUpgradeDialogOpen(true);
        return;
      }
    } else {
      if (!withinPrompRunsLimit) {
        setUpgradeDialogOpen(true);
        return;
      }
    }

    // 2. STREAMING STATE + CLEAR RESPONSE
    setIsStreaming(true);
    updateState({ response: { content: "", reasoning: "", calls: "" } }, false);

    // Increment run count for limit
    if (editorMode === "fromPlayground") {
      if (!hasPlaygroundAccess) {
        incrementPlaygroundRun();
      }
    } else if (promptId) {
      if (!hasPromptAccess) {
        incrementPromptRun();
      }
    }

    const variables = state.inputs || [];
    const variableMap = Object.fromEntries(
      variables.map((v) => [v.name, v.value || ""])
    );

    // 3. SAVE: If from Editor, and state is dirty
    if (editorMode === "fromEditor" && state.isDirty) {
      const latestVersionId = promptVersionsData?.[0]?.id;
      if (!latestVersionId) return;

      // A. Build Helicone Template for Saving
      const heliconeTemplate = {
        ...state.parameters,
        tools:
          state.parameters.tools?.length === 0
            ? undefined
            : state.parameters.tools, // TODO: Only here for backwards compatibility
        provider: undefined, // TODO: Move provider to the prompt?
        messages: state.messages,
      };

      // B. Build Metadata for Saving
      const metadata = {
        provider: state.parameters.provider.toUpperCase(),
        isProduction: false,
        inputs: variableMap,
      };
      console.log("Saving Template:", heliconeTemplate, metadata);

      try {
        let result = await jawnClient.POST(
          "/v1/prompt/version/{promptVersionId}/subversion-from-ui",
          {
            params: { path: { promptVersionId: latestVersionId } },
            body: {
              newHeliconeTemplate: heliconeTemplate,
              metadata,
              isMajorVersion: true,
            },
          }
        );

        if (result?.error || !result?.data) {
          setNotification("Error saving prompt", "error");
          return;
        }

        loadVersionData(result.data.data);
        await refetchPromptVersions();
      } catch (error) {
        console.error("Save error:", error);
        setNotification("Failed to save and run prompt", "error");
        return;
      }
    }

    // 5. RUN: Use toExternal mapper (going to OPENROUTER) + autoFillInputs to handle variable replacement
    const runTemplate = openaiChatMapper.toExternal({
      ...state.parameters,
      messages: autoFillInputs({
        inputs: variableMap,
        autoInputs: [],
        template: state.messages,
      }),
    });

    // 6. EXECUTE
    try {
      abortController.current = new AbortController();

      try {
        const stream = await generateStream({
          ...runTemplate,
          signal: abortController.current.signal,
        } as any);

        await processStream(
          stream,
          {
            initialState: { content: "", reasoning: "", calls: "" },
            onUpdate: (result) => {
              setState((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  response: result,
                };
              });
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
  }, [
    promptId,
    state,
    isStreaming,
    canRun,
    withinPlaygroundRunsLimit,
    withinPrompRunsLimit,
    hasPlaygroundAccess,
    hasPromptAccess,
    incrementPlaygroundRun,
    incrementPromptRun,
    jawnClient,
    setNotification,
    refetchPromptVersions,
    loadVersionData,
    updateState,
    promptVersionsData,
    editorMode,
  ]);
  // - Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesScrollRef.current?.scrollToBottom();
  }, []);
  // - Auto-Improve
  const handleImprove = useCallback(async () => {
    setIsImproving(true);

    // Convert messages to template tags for natural understanding of variables
    const templateTagMessages = state?.messages.map((msg) => ({
      ...msg,
      content: heliconeToTemplateTags(msg.content || ""),
    }));
    const prompt = autoImprovePrompt(templateTagMessages || []);

    try {
      abortController.current = new AbortController();

      const stream = await generateStream({
        provider: "OPENROUTER",
        model: "anthropic/claude-3.7-sonnet:thinking",
        messages: [$system(prompt.system), $user(prompt.user)],
        temperature: 1,
        includeReasoning: true,
        signal: abortController.current.signal,
        stop: ["</improved_user>", "</response_format>"], // TODO: Make this dynamic
      });

      await processStream(
        stream,
        {
          initialState: { content: "", reasoning: "", calls: "" },
          onUpdate: (result) => {
            updateState(
              (prev) => ({
                improvement: {
                  content: result.content,
                  reasoning: result.reasoning,
                },
              }),
              false
            );
          },
        },
        abortController.current.signal
      );
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Error generating improvements:", error);
        setNotification("Failed to generate improvements", "error");
      }
    } finally {
      setIsImproving(false);
      abortController.current = null;
    }
  }, [state?.messages, updateState, setNotification]);
  // - Apply Improvements
  const handleApplyImprovement = useCallback(async () => {
    if (!state?.improvement?.content) return;

    try {
      const improvedMessages = parseImprovedMessages(state.improvement.content);

      const latestVersionId = promptVersionsData?.[0]?.id;
      if (!latestVersionId) return;

      // Build Helicone Template for Saving
      const heliconeTemplate = {
        ...state.parameters,
        messages: improvedMessages.map((msg) => ({
          ...msg,
          content: templateToHeliconeTags(msg.content || ""), // Convert any template tags present to helicone tags
        })),
      };

      const metadata = {
        isProduction: false,
        createdFromUi: true,
        provider: state.parameters.provider,
        inputs: Object.fromEntries(
          (state.inputs || []).map((v) => [v.name, v.value || ""])
        ),
      };

      const result = await jawnClient.POST(
        "/v1/prompt/version/{promptVersionId}/subversion",
        {
          params: { path: { promptVersionId: latestVersionId } },
          body: {
            newHeliconeTemplate: heliconeTemplate,
            metadata,
            isMajorVersion: true,
          },
        }
      );

      if (result?.error || !result?.data) {
        setNotification("Error saving improved prompt", "error");
        return;
      }

      // Load the new version data and refresh the versions list
      loadVersionData(result.data.data);
      await refetchPromptVersions();

      setNotification("Successfully applied improvements", "success");
      setIsAutoImproveOpen(false);
    } catch (error) {
      console.error("Error applying improvements:", error);
      setNotification("Failed to apply improvements", "error");
    }
  }, [
    state,
    promptVersionsData,
    jawnClient,
    loadVersionData,
    refetchPromptVersions,
    setNotification,
  ]);
  // - From Request or Playground: Handle Save As Prompt
  const handleSaveAsPrompt = useCallback(async () => {
    if (!state) return;

    if (!withinPromptsLimit) {
      setUpgradeDialogOpen(true);
      return;
    }

    try {
      // Create a prompt from the current state
      const prompt = {
        messages: state.messages,
        ...state.parameters,
        provider: undefined, // TODO: Move provider to the prompt?
      };

      // Extract variable values for metadata
      const inputsMap = Object.fromEntries(
        (state.inputs || []).map((v) => [v.name, v.value || ""])
      );

      // Include metadata with the request
      const metadata = {
        provider: state.parameters.provider,
        createdFromUi: true,
        inputs: inputsMap,
      };

      const res = await createPrompt(prompt, metadata);
      if (res?.id) {
        setNotification("Prompt created successfully", "success");
        router.push(`/prompts/${res.id}`);
      }
    } catch (error) {
      console.error("Error creating prompt:", error);
      setNotification("Failed to create prompt", "error");
    }
  }, [state, withinPromptsLimit, createPrompt, router, setNotification]);

  /* -------------------------------------------------------------------------- */
  /*                                   Effects                                  */
  /* -------------------------------------------------------------------------- */
  // - Load Initial State
  useEffect(() => {
    // Don't proceed with loading if we don't know whether the prompt is imported from code yet
    if (editorMode === null) return;

    // Initialize state only if it hasn't been set yet
    if (!state) {
      switch (editorMode) {
        case "fromRequest":
          if (requestData?.data) {
            const mappedContent = heliconeRequestToMappedContent(
              requestData.data
            );
            const provider = findClosestProvider(
              mappedContent.schema.request.provider || "OPENAI"
            );
            const model = findClosestModel(
              provider,
              mappedContent.schema.request.model || "gpt-4"
            );

            setState({
              messages: mappedContent.schema.request.messages || [],
              parameters: {
                provider: provider,
                model: model,
                temperature:
                  mappedContent.schema.request.temperature ?? undefined,
                max_tokens:
                  mappedContent.schema.request.max_tokens ?? undefined,
                tools: mappedContent.schema.request.tools ?? undefined,
                reasoning_effort:
                  mappedContent.schema.request.reasoning_effort ?? undefined,
              },
              inputs: [],
              isDirty: false,
            });
          }
          break;

        case "fromEditor":
        case "fromCode":
          if (
            promptVersionsData &&
            promptVersionsData.length > 0 &&
            !isVersionsLoading
          ) {
            loadVersionData(promptVersionsData[0]);
          }
          break;

        case "fromPlayground":
          if (basePrompt) {
            const provider = findClosestProvider(
              basePrompt.metadata.provider || "OPENAI"
            );
            const model = findClosestModel(
              provider,
              basePrompt.body.model || "gpt-4o-mini"
            );

            setState({
              messages: basePrompt.body.messages || [],
              parameters: {
                provider: provider,
                model: model,
                temperature: basePrompt.body.temperature ?? undefined,
                max_tokens: basePrompt.body.max_tokens ?? undefined,
                tools: basePrompt.body.tools ?? undefined,
                reasoning_effort: basePrompt.body.reasoning_effort ?? undefined,
              },
              inputs: Object.entries(basePrompt.metadata.inputs || {}).map(
                ([name, value]) => ({
                  name,
                  value: value as string,
                  isValid: isValidVariableName(name),
                })
              ),
              isDirty: false,
            });
          }
          break;
      }
    }
  }, [
    editorMode,
    state,
    requestData,
    promptVersionsData,
    isVersionsLoading,
    basePrompt,
    loadVersionData,
  ]);
  // - Handle Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === "Enter" &&
        editorMode === "fromEditor"
      ) {
        event.preventDefault();
        handleSaveAndRun();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSaveAndRun, editorMode]);

  /* -------------------------------------------------------------------------- */
  /*                                   Helpers                                  */
  /* -------------------------------------------------------------------------- */
  // - Add Messages
  const handleAddMessages = (messages?: Message[]) => {
    updateState((prev) => {
      if (!prev) return {};

      // If no messages provided, add default empty message pair
      if (!messages) {
        return isLastMessageUser(prev.messages)
          ? {
              messages: [
                ...prev.messages,
                { _type: "message", role: "assistant", content: "" },
                { _type: "message", role: "user", content: "" },
              ],
            }
          : {};
      }

      // For any provided messages, append them if last message is user
      // or if it's a single assistant message (prefill)
      const isAddingSingleAssistant =
        messages.length === 1 && messages[0].role === "assistant";
      if (isLastMessageUser(prev.messages) || isAddingSingleAssistant) {
        return {
          messages: [...prev.messages, ...messages],
        };
      }

      return {};
    });
  };

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */
  // TODO: Prompt or request not found page with more info (use mutations I think)
  // - Loading
  if (editorMode === null || !state) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingAnimation
          title={
            promptId && editorMode === null
              ? "Determining prompt source..."
              : "Loading prompt..."
          }
        />
      </div>
    );
  }
  // - Editor
  return (
    <main className="relative flex flex-col h-screen">
      {/* Header */}
      <div className="h-16 shrink-0 bg-slate-100 dark:bg-slate-900 flex flex-row items-center justify-between px-4 py-2.5 z-50 border-b border-slate-200 dark:border-slate-800">
        {/* Left Side: Navigation */}
        <div className="flex flex-row items-center gap-2">
          {/* Back Button */}
          {promptId && (
            <Link
              className="text-base text-slate-500 hover:text-heliblue"
              href="/prompts"
            >
              <PiCaretLeftBold />
            </Link>
          )}
          {/* Version Selector */}
          {promptId && (
            <VersionSelector
              id={promptData?.user_defined_id || ""}
              currentVersion={state.version ?? 0}
              masterVersion={state.masterVersion ?? 0}
              versions={promptVersionsData || []}
              isLoading={isVersionsLoading}
              isDirty={state.isDirty}
              onVersionSelect={loadVersionData}
              onVersionPromote={handleVersionPromote}
              onIdEdit={handleIdEdit}
            />
          )}

          {/* From Request: ID Label */}
          {requestId && (
            <Link
              className="text-sm text-secondary hover:underline"
              href={`/requests?requestId=${requestId}`}
            >
              From Request: {requestId}
            </Link>
          )}

          {/* Metrics Drawer */}
          {promptId && (
            <Drawer>
              <DrawerTrigger>
                <Button variant="link">
                  <PiChartBarBold className="h-4 w-4 mr-2" />
                  Metrics
                </Button>
              </DrawerTrigger>
              <DrawerContent className="w-full h-[75vh]">
                <ScrollArea className="h-full">
                  <PromptMetricsTab
                    id={promptId}
                    promptUserDefinedId={promptData?.user_defined_id || ""}
                  />
                </ScrollArea>
              </DrawerContent>
            </Drawer>
          )}

          {/* From Request or From Playground: Unsaved Changes Indicator */}
          {(editorMode === "fromRequest" ||
            editorMode === "fromPlayground" ||
            editorMode === "fromCode") &&
            state.isDirty && (
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <div className="flex flex-row items-center gap-2 cursor-default">
                    <div
                      className={`h-2 w-2 rounded-full bg-amber-500 animate-pulse`}
                    />
                    <span className="text-sm text-secondary font-semibold">
                      Unsaved Changes
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="max-w-64 text-center">
                    {editorMode === "fromCode"
                      ? "This prompt cannot be managed by Helicone because it was imported from code. "
                      : ""}
                    <span className="font-semibold">
                      {editorMode === "fromCode"
                        ? "Save As Editor Prompt"
                        : "Save As Prompt"}
                    </span>{" "}
                    to keep your progress.
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
        </div>

        {/* Right Side: Actions */}
        <div className="flex flex-row items-center gap-2">
          {/* Auto-Improve Button */}
          {editorMode === "fromEditor" && (
            <Button
              variant="link"
              onClick={() => setIsAutoImproveOpen(true)}
              disabled={state.isDirty || !canRun}
            >
              <PiBrainBold className="h-4 w-4 mr-2" />
              Auto-Improve
            </Button>
          )}

          {/* From Request, Playground, or Imported From Code: Save As Prompt Button */}
          {(editorMode === "fromRequest" ||
            editorMode === "fromPlayground" ||
            editorMode === "fromCode") && (
            <Button
              className="text-white"
              variant="action"
              size="sm"
              onClick={handleSaveAsPrompt}
              disabled={isCreatingPrompt || state.messages.length === 0}
            >
              {isCreatingPrompt ? (
                <>
                  <PiSpinnerGapBold className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editorMode === "fromCode" ? (
                "Save as Editor Prompt"
              ) : (
                "Save As Prompt"
              )}
            </Button>
          )}

          {/* Run & Save Button */}
          {editorMode === "fromEditor" && state.isDirty ? (
            <FreeTierLimitWrapper
              feature="prompts"
              subfeature="versions"
              itemCount={versionCount}
            >
              <Button
                className={`${
                  isStreaming
                    ? "bg-red-500 hover:bg-red-500/90 dark:bg-red-500 dark:hover:bg-red-500/90 text-white hover:text-white"
                    : ""
                }`}
                variant="action"
                size="sm"
                disabled={!canRun}
                onClick={handleSaveAndRun}
              >
                {isStreaming ? (
                  <PiStopBold className="h-4 w-4 mr-2" />
                ) : (
                  <PiPlayBold className="h-4 w-4 mr-2" />
                )}
                <span className="mr-2">
                  {isStreaming
                    ? "Stop"
                    : state.isDirty && editorMode === "fromEditor"
                    ? "Save & Run"
                    : "Run"}
                </span>
                {isStreaming && (
                  <PiSpinnerGapBold className="h-4 w-4 mr-2 animate-spin" />
                )}
                <div className="flex items-center gap-0.5 text-sm opacity-60">
                  <PiCommandBold className="h-4 w-4" />
                  <MdKeyboardReturn className="h-4 w-4" />
                </div>
              </Button>
            </FreeTierLimitWrapper>
          ) : (
            <Button
              className={`${
                isStreaming
                  ? "bg-red-500 hover:bg-red-500/90 dark:bg-red-500 dark:hover:bg-red-500/90 text-white hover:text-white"
                  : ""
              }`}
              variant={editorMode === "fromEditor" ? "action" : "outline"}
              size="sm"
              disabled={!canRun}
              onClick={handleSaveAndRun}
            >
              {isStreaming ? (
                <PiStopBold className="h-4 w-4 mr-2" />
              ) : (
                <PiPlayBold className="h-4 w-4 mr-2" />
              )}
              <span className="mr-2">
                {isStreaming
                  ? "Stop"
                  : state.isDirty && editorMode === "fromEditor"
                  ? "Save & Run"
                  : "Run"}
              </span>
              {isStreaming && (
                <PiSpinnerGapBold className="h-4 w-4 mr-2 animate-spin" />
              )}
              <div className="flex items-center gap-0.5 text-sm opacity-60">
                <PiCommandBold className="h-4 w-4" />
                <MdKeyboardReturn className="h-4 w-4" />
              </div>
            </Button>
          )}

          {/* Experiment Button */}
          {promptId && (
            <Button
              variant="outline"
              size="sm"
              disabled={newFromPromptVersion.isPending}
              onClick={async () => {
                const result = await newFromPromptVersion.mutateAsync({
                  name: `${promptData?.user_defined_id}_V${state.version}.${state.versionId}`,
                  originalPromptVersion: state.versionId ?? "",
                });
                router.push(`/experiments/${result.data?.data?.experimentId}`);
              }}
            >
              <FlaskConicalIcon className="h-4 w-4 mr-2" />
              <span>Experiment</span>
            </Button>
          )}

          {/* Deploy Button */}
          {promptId && (
            <DeployDialog
              promptId={promptId}
              userDefinedId={promptData?.user_defined_id || "my-prompt-id"}
              state={state}
              isImportedFromCode={editorMode === "fromCode"}
            />
          )}
        </div>
      </div>

      {/* Version limit warning banner */}
      {!withinVersionsLimit && editorMode === "fromEditor" && (
        <FreeTierLimitBanner
          feature="prompts"
          subfeature="versions"
          itemCount={versionCount}
          freeLimit={3}
        />
      )}

      {/* Playground run limit warning banner */}
      {editorMode === "fromPlayground" &&
        !withinPlaygroundRunsLimit &&
        playgroundRunCount > 0 && (
          <FreeTierLimitBanner
            feature="prompts"
            subfeature="playground_runs"
            itemCount={playgroundRunCount}
            freeLimit={maxPlaygroundRuns}
            message={`You've used ${playgroundRunCount}/${maxPlaygroundRuns} playground runs. Upgrade to Pro Tier for unlimited access.`}
            buttonText="Upgrade"
            buttonSize="sm"
          />
        )}

      {/* Prompt run limit warning banner */}
      {promptId && !withinPrompRunsLimit && promptRunCount > 0 && (
        <FreeTierLimitBanner
          feature="prompts"
          subfeature="runs"
          itemCount={promptRunCount}
          freeLimit={maxPromptRuns}
          message={`You've used ${promptRunCount}/${maxPromptRuns} prompt runs. Upgrade to Prompts Tier for unlimited access.`}
          buttonText="Upgrade"
          buttonSize="sm"
        />
      )}

      {/* Prompt Editor */}
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={50} minSize={25}>
          <CustomScrollbar
            ref={messagesScrollRef}
            className="h-full bg-white dark:bg-black"
          >
            <MessagesPanel
              messages={state.messages}
              onMessageChange={handleMessageChange}
              onAddMessagePair={() => handleAddMessages()}
              onAddPrefill={() =>
                handleAddMessages([
                  { _type: "message", role: "assistant", content: "" },
                ])
              }
              onRemoveMessage={handleRemoveMessage}
              onVariableCreate={handleVariableCreate}
              variables={state.inputs || []}
              isPrefillSupported={isPrefillSupported(state.parameters.provider)}
              scrollToBottom={scrollToBottom}
            />
          </CustomScrollbar>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50} minSize={30}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50} minSize={25}>
              <CustomScrollbar className="h-full flex flex-col gap-4 bg-slate-50 dark:bg-slate-950">
                <ResponsePanel
                  response={state.response}
                  onAddToMessages={() =>
                    handleAddMessages([
                      {
                        _type: "message",
                        role: "assistant",
                        content:
                          typeof state.response === "string"
                            ? state.response
                            : (state.response as PromptState["response"])
                                ?.content || "",
                      },
                      { _type: "message", role: "user", content: "" },
                    ])
                  }
                  scrollToBottom={scrollToBottom}
                />
              </CustomScrollbar>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={50} minSize={25}>
              <CustomScrollbar className="h-full flex flex-col gap-4 bg-white dark:bg-black">
                <VariablesPanel
                  variables={state.inputs || []}
                  onVariableChange={handleVariableChange}
                  promptVersionId={state.versionId}
                />

                <ParametersPanel
                  parameters={state.parameters}
                  onParameterChange={(updates) => {
                    updateState((prev) => {
                      if (!prev) return {};
                      return {
                        parameters: {
                          ...prev.parameters,
                          ...updates,
                        },
                      };
                    });
                  }}
                />

                <ToolPanel
                  tools={state.parameters.tools || []}
                  onToolsChange={(tools) => {
                    updateState((prev) => {
                      if (!prev) return {};
                      return {
                        parameters: {
                          ...prev.parameters,
                          tools,
                        },
                      };
                    });
                  }}
                />
              </CustomScrollbar>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Helicone Upgrade Dialog */}
      <UpgradeProDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        featureName={editorMode === "fromPlayground" ? "Playground" : "Prompts"}
        limitMessage={
          !withinPromptsLimit
            ? promptsLimitUpgradeMessage
            : editorMode === "fromPlayground" && !withinPlaygroundRunsLimit
            ? playgroundRunsUpgradeMessage
            : promptRunsUpgradeMessage
        }
      />

      {/* Auto-improve Popup */}
      {promptId && !!state.version && (
        <UniversalPopup
          title="Auto-Improve (Beta)"
          width="w-full max-w-7xl"
          isOpen={isAutoImproveOpen}
          onClose={() => {
            setIsAutoImproveOpen(false);
            updateState({ improvement: undefined }, false);
          }}
        >
          <AutoImprove
            isImproving={isImproving}
            improvement={state.improvement}
            version={state.version}
            messages={state.messages}
            onStartImprove={handleImprove}
            onApplyImprovement={handleApplyImprovement}
            onCancel={() => setIsAutoImproveOpen(false)}
            updateState={(updates) => updateState(updates, false)}
          />
        </UniversalPopup>
      )}
    </main>
  );
}
