import LoadingAnimation from "@/components/shared/loadingAnimation";
import useNotification from "@/components/shared/notification/useNotification";
import AutoImprove from "@/components/shared/prompts/AutoImprove";
import MessagesPanel from "@/components/shared/prompts/MessagesPanel";
import ParametersPanel from "@/components/shared/prompts/ParametersPanel";
import ResponsePanel from "@/components/shared/prompts/ResponsePanel";
import VariablesPanel from "@/components/shared/prompts/VariablesPanel";
import GlassHeader from "@/components/shared/universal/GlassHeader";
import ResizablePanels from "@/components/shared/universal/ResizablePanels";
import VersionSelector from "@/components/shared/universal/VersionSelector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateStream } from "@/lib/api/llm/generate-stream";
import { readStream } from "@/lib/api/llm/read-stream";
import { useJawnClient } from "@/lib/clients/jawnHook";
import autoImprovePrompt from "@/prompts/auto-improve";
import { PromptState, StateVariable } from "@/types/prompt-state";
import { $system, $user } from "@/utils/llm";
import {
  isLastMessageUser,
  isPrefillSupported,
  parseImprovedMessages,
  removeMessagePair,
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
import { Message } from "packages/llm-mapper/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdKeyboardReturn } from "react-icons/md";
import {
  PiBrainBold,
  PiCaretLeftBold,
  PiCommandBold,
  PiPlayBold,
  PiRocketLaunchBold,
  PiSpinnerGapBold,
  PiStopBold,
} from "react-icons/pi";

import UniversalPopup from "@/components/shared/universal/Popup";
import {
  usePrompt,
  usePromptVersions,
} from "../../../../services/hooks/prompts/prompts";
import { DiffHighlight } from "../../welcome/diffHighlight";
import { useExperiment } from "./hooks";
import PromptMetricsTab from "./PromptMetricsTab";

interface PromptIdPageProps {
  id: string;
  currentPage: number;
  pageSize: number;
}

export default function PromptIdPage(props: PromptIdPageProps) {
  // PARAMS
  const { id, currentPage, pageSize } = props;

  // STATE
  const [state, setState] = useState<PromptState | null>(null);
  const [isAutoIterateOpen, setIsAutoIterateOpen] = useState(false);
  const [isImproving, setIsImproving] = useState(false);

  // STREAMING
  const [isStreaming, setIsStreaming] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  // HOOKS
  // - Router
  const router = useRouter();
  // - Jawn Client
  const jawnClient = useJawnClient();
  // - Prompt Table
  const {
    prompt,
    isLoading: isPromptLoading,
    refetch: refetchPrompt,
  } = usePrompt(id);
  // - Prompt Versions Table
  const {
    prompts: promptVersions,
    isLoading: isVersionsLoading,
    refetch: refetchPromptVersions,
  } = usePromptVersions(id);
  // - Notifications
  const { setNotification } = useNotification();
  // - Experiment
  const { newFromPromptVersion } = useExperiment();

  // VALIDATION
  // - Can Run
  const canRun = useMemo(
    () =>
      (state?.messages.some(
        (m) =>
          typeof m !== "string" &&
          m.role === "user" &&
          (typeof m.content === "string" ? m.content.trim().length > 0 : true)
      ) ??
        false) &&
      prompt?.metadata?.createdFromUi !== false,
    [state?.messages, prompt?.metadata?.createdFromUi]
  );

  // CALLBACKS
  // - Load Version Data into State
  const loadVersionData = useCallback(
    (ver: any) => {
      if (!ver) return;
      // 1. Parse the helicone template and metadata columns from the version
      const templateData =
        typeof ver.helicone_template === "string"
          ? JSON.parse(ver.helicone_template)
          : ver.helicone_template;

      console.log("Template data:", templateData);

      const metadata =
        typeof ver.metadata === "string"
          ? JSON.parse(ver.metadata)
          : (ver.metadata as {
              provider?: string;
              isProduction?: boolean;
              inputs?: Record<string, string>;
            });

      // 2. Derive "masterVersion" if needed
      const masterVersion =
        metadata?.isProduction === true
          ? ver.major_version
          : promptVersions?.find(
              (v) => (v.metadata as { isProduction?: boolean })?.isProduction
            )?.major_version ?? ver.major_version;

      // 3. Convert any messages in the template to StateMessages
      const stateMessages = (templateData.messages ||
        templateData.content) as Message[];

      // 4.A. First collect all variables and their default values from the metadata inputs
      let variables: StateVariable[] = Object.entries(
        metadata.inputs || {}
      ).map(([name, value]) => ({
        name,
        value: value as string,
        isValid: isValidVariableName(name),
      }));
      // 4.B. Extract additional variables contained in message content
      stateMessages.forEach((msg) => {
        const vars = extractVariables(msg.content || "", "helicone");
        vars.forEach((v) => {
          variables.push({
            name: v.name,
            value: metadata?.inputs?.[v.name] ?? v.value ?? "",
            isValid: v.isValid ?? true,
          });
        });
      });
      // 4.C. Add message variables to the list
      stateMessages.forEach((msg) => {
        msg.idx !== undefined &&
          variables.push({
            name: `message_${msg.idx}`,
            value: "",
            isValid: true,
            idx: msg.idx,
          });
      });

      // 4.D. Deduplicate variables
      variables = deduplicateVariables(variables);

      // 6. Update state with the processed data
      setState({
        promptId: id,
        masterVersion: masterVersion,
        version: ver.major_version,
        versionId: ver.id,
        messages: stateMessages,
        parameters: {
          provider: metadata?.provider ?? "openai",
          model: templateData.model ?? "gpt-4o-mini",
          temperature: templateData.temperature ?? 0.7,
        },
        variables: variables,
        evals: templateData.evals || [],
        structure: templateData.structure,
        isDirty: false,
      });
    },
    [id, promptVersions]
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
        const newUpdates =
          typeof updates === "function" ? updates(prev) : updates;
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
        const existingVariables = prev.variables || [];
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
          variables: updatedVariables,
        };
      });
    },
    [updateState]
  );
  // - Remove Message
  const handleRemoveMessage = useCallback(
    (index: number) => {
      updateState({
        messages: removeMessagePair(state!.messages, index),
      });
    },
    [state, updateState]
  );
  // - Create Variable
  const handleVariableCreate = useCallback(
    (newVariable: StateVariable) => {
      updateState((prev) => {
        if (!prev) return {};
        const currentVars = [...(prev.variables || [])];
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

        return { variables: currentVars };
      });
    },
    [updateState]
  );
  // - Change Variable
  const handleVariableChange = useCallback(
    (index: number, value: string) => {
      updateState((prev) => {
        if (!prev?.variables) return {};

        const updatedVariables = [...prev.variables];
        const variable = updatedVariables[index];
        updatedVariables[index] = { ...variable, value };

        // If this variable has an idx, also update the corresponding message
        if (variable.idx !== undefined) {
          let parsedValue: Message;
          try {
            parsedValue = JSON.parse(value);
          } catch (e) {
            return { variables: updatedVariables };
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
            variables: updatedVariables,
            messages: updatedMessages,
          };
        }

        return { variables: updatedVariables };
      }, false);
    },
    [updateState]
  );
  // - Promote Version
  const handleVersionPromote = useCallback(
    async (version: any) => {
      if (!version) return;

      const currentProductionVersion = promptVersions?.find(
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
    [jawnClient, promptVersions, refetchPromptVersions, setNotification]
  );
  // - Handle ID Edit
  const handleIdEdit = useCallback(
    async (newId: string) => {
      const kebabId = toKebabCase(newId);
      if (kebabId !== id) {
        const result = await jawnClient.PATCH(
          "/v1/prompt/{promptId}/user-defined-id",
          {
            params: {
              path: {
                promptId: prompt?.id || "",
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
    [id, jawnClient, prompt?.id, refetchPrompt, setNotification]
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

    // 2. STREAMING STATE + CLEAR RESPONSE
    setIsStreaming(true);
    updateState({ response: "" }, false);

    const variables = state.variables || [];
    const variableMap = Object.fromEntries(
      variables.map((v) => [v.name, v.value || ""])
    );

    // 3. SAVE: If dirty
    if (state.isDirty) {
      const latestVersionId = promptVersions?.[0]?.id;
      if (!latestVersionId) return;

      // A. Build Helicone Template for Saving
      const heliconeTemplate = {
        model: state.parameters.model,
        temperature: state.parameters.temperature,
        messages: state.messages,
      };

      // B. Build Metadata for Saving
      const metadata = {
        provider: state.parameters.provider.toUpperCase(),
        isProduction: false,
        inputs: variableMap,
      };

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

    // 5. RUN: Use autoFillInputs to handle variable replacement
    const runTemplate = {
      ...state.parameters,
      messages: autoFillInputs({
        inputs: variableMap,
        autoInputs: [],
        template: state.messages,
      }),
    };
    console.log("Run template:", runTemplate);

    // 6. EXECUTE
    try {
      abortController.current = new AbortController();

      try {
        const stream = await generateStream({
          ...runTemplate,
          signal: abortController.current.signal,
        } as any);

        await readStream(
          stream,
          (chunk: string) => {
            setState((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                response: (prev.response || "") + chunk,
              };
            });
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
      console.error("Failed to save state:", error);
      setNotification("Failed to save prompt state", "error");
      setIsStreaming(false);
    }
  }, [
    state,
    isStreaming,
    canRun,
    jawnClient,
    setNotification,
    refetchPromptVersions,
    loadVersionData,
    updateState,
    promptVersions,
  ]);

  // WIP
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
        provider: "DEEPSEEK",
        model: "deepseek-r1",
        messages: [$system(prompt.system), $user(prompt.user)],
        temperature: 1,
        includeReasoning: true,
        signal: abortController.current.signal,
        stop: ["</improved_user>", "</response_format>"], // TODO: Make this dynamic
      });

      await readStream(
        stream,
        (chunk: string) => {
          try {
            const jsonResponse = JSON.parse(chunk);

            // Handle different types of chunks
            if (jsonResponse.type === "content") {
              updateState(
                (prev) => ({
                  improvement: {
                    content:
                      (prev?.improvement?.content || "") + jsonResponse.chunk,
                    reasoning: prev?.improvement?.reasoning || "",
                  },
                }),
                false
              );
            } else if (jsonResponse.type === "reasoning") {
              updateState(
                (prev) => ({
                  improvement: {
                    content: prev?.improvement?.content || "",
                    reasoning:
                      (prev?.improvement?.reasoning || "") + jsonResponse.chunk,
                  },
                }),
                false
              );
            } else if (jsonResponse.type === "final") {
              // Final message just confirms the complete content and reasoning
              updateState(
                (prev) => ({
                  improvement: {
                    content: jsonResponse.content,
                    reasoning: jsonResponse.reasoning,
                  },
                }),
                false
              );
            }
          } catch (error) {
            console.error("Error parsing chunk:", error);
          }
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

  const handleApplyImprovement = useCallback(async () => {
    if (!state?.improvement?.content) return;

    try {
      const improvedMessages = parseImprovedMessages(state.improvement.content);

      const latestVersionId = promptVersions?.[0]?.id;
      if (!latestVersionId) return;

      // Build Helicone Template for Saving
      const heliconeTemplate = {
        model: state.parameters.model,
        temperature: state.parameters.temperature,
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
          (state.variables || []).map((v) => [v.name, v.value || ""])
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
      setIsAutoIterateOpen(false);
    } catch (error) {
      console.error("Error applying improvements:", error);
      setNotification("Failed to apply improvements", "error");
    }
  }, [
    state,
    promptVersions,
    jawnClient,
    loadVersionData,
    refetchPromptVersions,
    setNotification,
  ]);

  // EFFECTS
  // - Load Initial State
  useEffect(() => {
    if (
      !state &&
      promptVersions &&
      promptVersions.length > 0 &&
      !isVersionsLoading
    ) {
      loadVersionData(promptVersions[0]);
    }
  }, [isVersionsLoading, loadVersionData, promptVersions, state]);
  // - Handle Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === "Enter" &&
        prompt?.metadata?.createdFromUi !== false
      ) {
        event.preventDefault();
        handleSaveAndRun();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSaveAndRun, prompt?.metadata?.createdFromUi]);

  // HELPERS
  // - Add Message Pair
  const handleAddMessagePair = () => {
    updateState((prev) => {
      if (prev && isLastMessageUser(prev.messages)) {
        return {
          messages: [
            ...prev.messages,
            { _type: "message", role: "assistant", content: "" },
            { _type: "message", role: "user", content: "" },
          ],
        };
      } else return {};
    });
  };
  // - Add Prefill
  const handleAddPrefill = () => {
    updateState((prev) => {
      if (
        prev &&
        isPrefillSupported(prev.parameters.provider) &&
        isLastMessageUser(prev.messages)
      ) {
        return {
          messages: [
            ...prev.messages,
            { _type: "message", role: "assistant", content: "" },
          ],
        };
      } else return {};
    });
  };

  // RENDER
  // - Loading Page
  if (isPromptLoading || isVersionsLoading || !state) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingAnimation title="Loading prompt..." />
      </div>
    );
  }
  // - Page
  return (
    <Tabs className="relative flex flex-col h-screen" defaultValue="editor">
      {/* Header */}
      <GlassHeader>
        {/* Left Side: Navigation */}
        <div className="flex flex-row items-center gap-2">
          <Link
            className="text-base text-slate-500 hover:text-heliblue"
            href="/prompts"
          >
            <PiCaretLeftBold />
          </Link>
          <VersionSelector
            id={prompt?.user_defined_id || ""}
            currentVersion={state.version}
            masterVersion={state.masterVersion}
            versions={promptVersions || []}
            isLoading={isVersionsLoading}
            isDirty={state.isDirty}
            onVersionSelect={loadVersionData}
            onVersionPromote={handleVersionPromote}
            onIdEdit={handleIdEdit}
          />
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>
        </div>

        {/* Right Side: Actions */}
        <div className="flex flex-row items-center gap-2">
          <Button
            variant="link"
            onClick={() => setIsAutoIterateOpen(true)}
            disabled={state.isDirty}
          >
            <PiBrainBold className="h-4 w-4 mr-2" />
            Auto-Improve
          </Button>

          {/* Run & Save Button */}
          <Button
            className={`${
              isStreaming
                ? "bg-red-500 hover:bg-red-500/90 dark:bg-red-500 dark:hover:bg-red-500/90"
                : ""
            }`}
            variant="action"
            disabled={!canRun}
            onClick={handleSaveAndRun}
          >
            {isStreaming ? (
              <PiStopBold className="h-4 w-4 mr-2" />
            ) : (
              <PiPlayBold className="h-4 w-4 mr-2" />
            )}
            <span className="mr-2">
              {isStreaming ? "Stop" : state.isDirty ? "Save & Run" : "Run"}
            </span>
            {isStreaming && (
              <PiSpinnerGapBold className="h-4 w-4 mr-2 animate-spin" />
            )}
            <div
              className={`flex items-center gap-0.5 text-sm text-white opacity-60`}
            >
              <PiCommandBold className="h-4 w-4" />
              <MdKeyboardReturn className="h-4 w-4" />
            </div>
          </Button>

          {/* Experiment Button */}
          <Button
            variant="outline"
            disabled={newFromPromptVersion.isLoading}
            onClick={async () => {
              const result = await newFromPromptVersion.mutateAsync({
                name: `${prompt?.user_defined_id}_V${state.version}.${state.versionId}`,
                originalPromptVersion: state.versionId,
              });
              router.push(`/experiments/${result.data?.data?.experimentId}`);
            }}
          >
            <FlaskConicalIcon className="h-4 w-4 mr-2" />
            <span>Experiment</span>
          </Button>

          {/* Deploy Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={prompt?.metadata?.createdFromUi === false}
                onClick={() => {}}
              >
                <PiRocketLaunchBold className="h-4 w-4 mr-2" />
                <span>Deploy</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="h-[40rem] w-full max-w-4xl flex flex-col">
              <DialogHeader>
                <DialogTitle>Deploy Prompt</DialogTitle>
              </DialogHeader>

              {/* Code example */}
              <DiffHighlight
                maxHeight={false}
                className="h-full"
                code={`
export async function getPrompt(
  id: string,
  variables: Record<string, any>
): Promise<any> {
  const getHeliconePrompt = async (id: string) => {
    const res = await fetch(
      \`https://api.helicone.ai/v1/prompt/\${id}/template\`,
      {
        headers: {
          Authorization: \`Bearer \${YOUR_HELICONE_API_KEY}\`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: variables,
        }),
      }
    );

    return (await res.json()) as Result<PromptVersionCompiled, any>;
  };

  const heliconePrompt = await getHeliconePrompt(id);
  if (heliconePrompt.error) {
    throw new Error(heliconePrompt.error);
  }
  return heliconePrompt.data?.filled_helicone_template;
}

async function pullPromptAndRunCompletion() {
  const prompt = await getPrompt("${
    prompt?.user_defined_id || "my-prompt-id"
  }", {
    ${
      state?.variables
        ?.map((v) => `${v.name}: "${v.value || "value"}"`)
        .join(",\n    ") || 'color: "red"'
    }
  });
  console.log(prompt);

  const openai = new OpenAI({
    apiKey: "YOUR_OPENAI_API_KEY",
    baseURL: \`https://oai.helicone.ai/v1/\${YOUR_HELICONE_API_KEY}\`,
  });
  const response = await openai.chat.completions.create(
    prompt satisfies OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming
  );
  console.log(response);
}`}
                language="tsx"
                newLines={[]}
                oldLines={[]}
              />
            </DialogContent>
          </Dialog>
        </div>
      </GlassHeader>

      {/* Prompt Editor Tab */}
      <TabsContent className="flex-1 overflow-auto p-4" value="editor">
        <ResizablePanels
          leftPanel={
            <MessagesPanel
              messages={state.messages}
              onMessageChange={handleMessageChange}
              onAddMessagePair={handleAddMessagePair}
              onAddPrefill={handleAddPrefill}
              onRemoveMessage={handleRemoveMessage}
              onVariableCreate={handleVariableCreate}
              variables={state.variables || []}
              isPrefillSupported={isPrefillSupported(state.parameters.provider)}
            />
          }
          rightPanel={
            <div className="flex h-full flex-col gap-4">
              <ResponsePanel response={state.response || ""} />

              <VariablesPanel
                variables={state.variables || []}
                onVariableChange={handleVariableChange}
                promptVersionId={state.versionId}
              />

              {/* TODO: Planned */}
              {/* <EvalsPanel /> */}

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
            </div>
          }
        />
      </TabsContent>

      {/* Metrics Tab */}
      <TabsContent className="flex-1 overflow-auto" value="metrics">
        <PromptMetricsTab
          id={id}
          promptUserDefinedId={prompt?.user_defined_id || ""}
        />
      </TabsContent>

      {/* Auto-improve Popup */}
      <UniversalPopup
        title="Auto-Improve (Beta)"
        width="w-full max-w-7xl"
        isOpen={isAutoIterateOpen}
        onClose={() => {
          setIsAutoIterateOpen(false);
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
          onCancel={() => setIsAutoIterateOpen(false)}
          updateState={(updates) => updateState(updates, false)}
        />
      </UniversalPopup>
    </Tabs>
  );
}
