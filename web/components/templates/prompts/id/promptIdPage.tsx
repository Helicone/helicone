import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePrompt, usePromptVersions } from "@/services/hooks/prompts/prompts";
import { useJawnClient } from "@/lib/clients/jawnHook";
import useNotification from "@/components/shared/notification/useNotification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import ResizablePanels from "@/components/shared/universal/ResizablePanels";
import PromptPanels from "@/components/shared/prompts/PromptPanels";
import { PromptState, Variable } from "@/types/prompt-state";
import {
  extractVariables,
  replaceVariables,
  convertToHeliconeTags,
  replaceTagsWithVariables,
  isValidVariableName,
} from "@/utils/variables";
import {
  canAddMessagePair,
  canAddPrefillMessage,
  removeMessagePair,
} from "@/utils/messages";
import { canAddPrefill } from "@/utils/messages";
import PromptMetricsTab from "./PromptMetricsTab";
import ResponsePanel from "@/components/shared/prompts/ResponsePanel";
import ParametersPanel from "@/components/shared/prompts/ParametersPanel";
import { PiCommandBold, PiRocketLaunchBold } from "react-icons/pi";
import { generateStream } from "@/lib/api/llm/generate-stream";
import { readStream } from "@/lib/api/llm/read-stream";
import { toKebabCase } from "@/utils/strings";
import Link from "next/link";
import GlassHeader from "@/components/shared/universal/GlassHeader";
import ActionButton from "@/components/shared/universal/ActionButton";
import VersionSelector from "@/components/shared/universal/VersionSelector";
import { MdKeyboardReturn } from "react-icons/md";
import {
  PiSpinnerGapBold,
  PiStopBold,
  PiPlayBold,
  PiCaretLeftBold,
} from "react-icons/pi";
import VariablesPanel from "@/components/shared/prompts/VariablesPanel";

interface PromptIdPageProps {
  id: string;
  currentPage: number;
  pageSize: number;
}

export default function PromptIdPage(props: PromptIdPageProps) {
  // PARAMS
  const { id, currentPage, pageSize } = props;

  // HOOKS
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

  // STATE
  const [state, setState] = useState<PromptState | null>(null);

  // STREAMING
  const [isStreaming, setIsStreaming] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  // VALIDATION
  // - Can Run
  const canRun = useMemo(
    () =>
      (state?.messages.some(
        (m) =>
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
      // 1. Parse the helicone template. You might want to handle the case if it's already JSON-parsed.
      const templateData =
        typeof ver.helicone_template === "string"
          ? JSON.parse(ver.helicone_template)
          : ver.helicone_template;

      // 2. Derive "masterVersion" if needed
      const metadata = ver.metadata as { isProduction?: boolean };
      const masterVersion =
        metadata?.isProduction === true
          ? ver.major_version
          : promptVersions?.find(
              (v) => (v.metadata as { isProduction?: boolean })?.isProduction
            )?.major_version ?? ver.major_version;

      // 3. First collect all variables and their default values from the template inputs
      const inputs = ver?.metadata?.inputs || {};
      const variables = Object.entries(inputs).map(([name, value]) => ({
        name,
        value: value as string,
        isValid: isValidVariableName(name),
      }));

      // 4. Convert messages with Helicone tags to variable syntax
      const processedMessages = templateData.messages.map((msg: any) => {
        if (typeof msg.content === "string") {
          // Convert Helicone tags to variable syntax
          const content = replaceTagsWithVariables(msg.content);
          return {
            ...msg,
            content,
          };
        } else if (typeof msg.content === "object") {
          // Handle object content (if any)
          return msg;
        }
        return msg;
      });

      // 5. Extract any additional variables from messages that might not be in inputs
      processedMessages.forEach((msg: any) => {
        if (typeof msg.content === "string") {
          const messageVars = extractVariables(msg.content, true);
          messageVars.forEach(({ name, isValid }) => {
            // Only add if not already present
            if (!variables.find((v) => v.name === name)) {
              variables.push({
                name,
                value: inputs[name] || "",
                isValid: isValid ?? true,
              });
            }
          });
        }
      });

      // 6. Update state with the processed data
      setState({
        promptId: id,
        masterVersion: masterVersion,
        version: ver.major_version,
        versionId: ver.id,
        messages: processedMessages,
        parameters: {
          provider: ver.metadata?.provider || "openai",
          model: templateData.model || "gpt-4o-mini",
          temperature: templateData.temperature || 0.7,
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
      console.log("!!!state being updated");
    },
    []
  );
  // - Message Change
  const handleMessageChange = useCallback(
    (index: number, content: string) => {
      updateState((prev) => {
        if (!prev) return {};

        const newMessages = prev.messages.map((msg, i) =>
          i === index ? { ...msg, content } : msg
        );

        // Extract variables from all messages
        const messageVariables = newMessages.reduce<Variable[]>((acc, msg) => {
          if (typeof msg.content !== "string") return acc;
          const messageVars = extractVariables(msg.content, true);
          return [
            ...acc,
            ...messageVars.map((v) => ({
              name: v.name,
              value:
                prev.variables?.find((pv) => pv.name === v.name)?.value || "",
              isValid: v.isValid,
            })),
          ];
        }, []);

        // Keep only unique variables while preserving their existing values
        const mergedVariables = messageVariables.reduce<Variable[]>(
          (acc, variable) => {
            if (!acc.some((v) => v.name === variable.name)) {
              // Preserve the existing value if it exists
              const existingVar = prev.variables?.find(
                (v) => v.name === variable.name
              );
              acc.push({
                ...variable,
                value: existingVar?.value || variable.value || "",
              });
            }
            return acc;
          },
          []
        );

        return {
          messages: newMessages,
          variables: mergedVariables,
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
    (newVariable: Variable) => {
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

        console.log("!!!currentVars", currentVars);
        return { variables: currentVars };
      });
      console.log("!!!state.variables", state?.variables);
    },
    [updateState, state?.variables]
  );
  // - Change Variable
  const handleVariableChange = useCallback(
    (index: number, value: string) => {
      console.log("Changing variable at index:", index, "to value:", value);
      updateState((prev) => {
        if (!prev?.variables) return {};
        console.log("Previous variables:", prev.variables);
        const updatedVariables = [...prev.variables];
        updatedVariables[index] = { ...updatedVariables[index], value };
        console.log("Updated variables:", updatedVariables);
        return { variables: updatedVariables };
      });
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

      // 3.1. Build Helicone Template for Saving
      const heliconeTemplate = {
        model: state.parameters.model,
        temperature: state.parameters.temperature,
        messages: state.messages.map((msg) => ({
          ...msg,
          content:
            typeof msg.content === "string"
              ? convertToHeliconeTags(msg.content)
              : msg.content || "",
        })),
      };

      try {
        let result = await jawnClient.POST(
          "/v1/prompt/version/{promptVersionId}/subversion",
          {
            params: { path: { promptVersionId: latestVersionId } },
            body: {
              newHeliconeTemplate: heliconeTemplate,
              metadata: {
                isProduction: false,
                createdFromUi: true,
                inputs: variableMap,
                provider: state.parameters.provider,
              },
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
        console.error("Failed to save state:", error);
        setNotification("Failed to save and run prompt state", "error");
        return;
      }
    }

    // 5. RUN: Replace variables with their values for local execution
    const runTemplate = {
      ...state.parameters,
      messages: state.messages.map((msg) => ({
        ...msg,
        content:
          typeof msg.content === "string"
            ? replaceVariables(msg.content, variables)
            : msg.content || "",
      })),
    };

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
      if (!prev || !canAddMessagePair(prev.messages)) return {};
      return {
        messages: [
          ...prev.messages,
          { role: "assistant", content: "" },
          { role: "user", content: "" },
        ],
      };
    });
  };
  // - Add Prefill
  const handleAddPrefill = () => {
    updateState((prev) => {
      if (
        !prev ||
        !canAddPrefill(prev.parameters.provider) ||
        !canAddPrefillMessage(prev.messages)
      )
        return {};
      return {
        messages: [...prev.messages, { role: "assistant", content: "" }],
      };
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
    <Tabs className="relative flex flex-col" defaultValue="editor">
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
          <ActionButton
            label={isStreaming ? "Stop" : state.isDirty ? "Save & Run" : "Run"}
            icon={isStreaming ? PiStopBold : PiPlayBold}
            className={
              isStreaming
                ? "bg-red-500 hover:bg-red-500/90 text-white"
                : "bg-heliblue hover:bg-heliblue/90 text-white"
            }
            onClick={handleSaveAndRun}
            disabled={!canRun}
          >
            {isStreaming && <PiSpinnerGapBold className="animate-spin" />}

            <div
              className={`flex items-center gap-1 text-sm ${
                canRun && prompt?.metadata?.createdFromUi !== false
                  ? "text-white opacity-60"
                  : "text-slate-400"
              }`}
            >
              <PiCommandBold className="h-4 w-4" />
              <MdKeyboardReturn className="h-4 w-4" />
            </div>
          </ActionButton>

          <ActionButton
            label="Deploy"
            className="bg-white"
            icon={PiRocketLaunchBold}
            onClick={() => {}}
            disabled={prompt?.metadata?.createdFromUi === false}
          />
        </div>
      </GlassHeader>

      {/* Prompt Editor Tab */}
      <TabsContent className="p-4" value="editor">
        <ResizablePanels
          leftPanel={
            <PromptPanels
              messages={state.messages}
              onMessageChange={handleMessageChange}
              onAddMessagePair={handleAddMessagePair}
              onAddPrefill={handleAddPrefill}
              canAddPrefill={canAddPrefill(state.parameters.provider)}
              onRemoveMessage={handleRemoveMessage}
              onVariableCreate={handleVariableCreate}
              variables={state.variables || []}
            />
          }
          rightPanel={
            <div className="flex h-full flex-col gap-4">
              <ResponsePanel response={state.response || ""} />

              <VariablesPanel
                variables={state.variables || []}
                onVariableChange={handleVariableChange}
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
            </div>
          }
        />
      </TabsContent>

      {/* Metrics Tab */}
      <TabsContent value="metrics">
        <PromptMetricsTab
          id={id}
          promptUserDefinedId={prompt?.user_defined_id || ""}
        />
      </TabsContent>
    </Tabs>
  );
}
