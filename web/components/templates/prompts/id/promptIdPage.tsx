import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  usePrompt,
  usePromptVersions,
} from "../../../../services/hooks/prompts/prompts";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useJawnClient } from "../../../../lib/clients/jawnHook";
import useNotification from "../../../shared/notification/useNotification";
import HcBreadcrumb from "../../../ui/hcBreadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingAnimation from "../../../shared/loadingAnimation";
import ResizablePanels from "../../../shared/universal/ResizablePanels";
import PromptPanels from "@/components/shared/prompts/PromptPanels";
import { PromptState, Variable } from "@/types/prompt-state";
import { extractVariables } from "@/utils/variables";
import {
  canAddMessagePair,
  canAddPrefillMessage,
  removeMessagePair,
} from "@/utils/messages";
import { canAddPrefill } from "@/utils/messages";
import PromptMetricsTab from "./PromptMetricsTab";
import ResponsePanel from "@/components/shared/prompts/ResponsePanel";
import { PiSpinnerGapBold, PiStopBold, PiPlayBold } from "react-icons/pi";
import { PiCommandBold } from "react-icons/pi";
import ActionButton from "@/components/shared/universal/ActionButton";
import { MdKeyboardReturn } from "react-icons/md";
import { generateStream } from "@/lib/api/llm/generate-stream";
import { readStream } from "@/lib/api/llm/read-stream";
import { replaceVariables } from "@/utils/variables";

interface PromptIdPageProps {
  id: string;
  currentPage: number;
  pageSize: number;
}

const PromptIdPage = (props: PromptIdPageProps) => {
  const { id, currentPage, pageSize } = props;
  const router = useRouter();
  const jawnClient = useJawnClient();
  const { setNotification } = useNotification();

  // Hooks
  const {
    prompt,
    isLoading: isPromptLoading,
    refetch: refetchPrompt,
  } = usePrompt(id);
  const {
    prompts: promptVersions,
    isLoading: isVersionsLoading,
    refetch: refetchPromptVersions,
  } = usePromptVersions(id);
  const [state, setState] = useState<PromptState | null>(null);

  // STREAMING
  const [isStreaming, setIsStreaming] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  // VALIDATION
  const canRun = useMemo(
    () =>
      state?.messages.some(
        m =>
          m.role === "user" &&
          (typeof m.content === "string" ? m.content.trim().length > 0 : true)
      ) ?? false,
    [state?.messages]
  );

  // All callbacks defined with useCallback
  const updateState = useCallback((updates: Partial<PromptState>) => {
    setState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...updates,
        isDirty: true,
      };
    });
  }, []);

  const handleMessageChange = useCallback((index: number, content: string) => {
    setState(prev => {
      if (!prev) return null;

      const newMessages = prev.messages.map((msg, i) =>
        i === index ? { ...msg, content } : msg
      );

      // Extract all variables from all messages
      const allVariables = newMessages.reduce<Variable[]>((acc, msg) => {
        const messageVars = extractVariables(msg.content as string, true);
        return [
          ...acc,
          ...messageVars.map(v => ({
            name: v.name,
            value: prev.variables?.find(pv => pv.name === v.name)?.value || "",
            isValid: v.isValid,
          })),
        ];
      }, []);

      // Deduplicate variables (keep first occurrence)
      const uniqueVars = allVariables.filter(
        (v, idx, self) => idx === self.findIndex(t => t.name === v.name)
      );

      return {
        ...prev,
        messages: newMessages,
        variables: uniqueVars,
        isDirty: true,
      };
    });
  }, []);

  const handleRemoveMessage = useCallback(
    (index: number) => {
      updateState({
        messages: removeMessagePair(state!.messages, index),
      });
    },
    [state, updateState]
  );

  const handleVariableCreate = useCallback((newVariable: Variable) => {
    setState(prev => {
      if (!prev) return null;

      const existingVars = prev.variables || [];
      const existingIndex = existingVars.findIndex(
        v => v.name === newVariable.name
      );

      // If variable exists, update its value, otherwise add it
      const newVars =
        existingIndex >= 0
          ? existingVars.map((v, i) => (i === existingIndex ? newVariable : v))
          : [...existingVars, newVariable];

      return {
        ...prev,
        variables: newVars,
        isDirty: true,
      };
    });
  }, []);

  const handleVariableChange = useCallback(
    (index: number, value: string) => {
      updateState({
        variables: state?.variables?.map((v, i) =>
          i === index ? { ...v, value } : v
        ),
      });
    },
    [state?.variables, updateState]
  );

  const handleSaveAndRun = useCallback(async () => {
    if (!state || !canRun) return;

    // -> ABORT: If already streaming
    if (isStreaming) {
      abortController.current?.abort();
      setIsStreaming(false);
      return;
    }

    // -> LOADING STATE
    setIsStreaming(true);
    setState(prev => (prev ? { ...prev, response: "" } : null));

    // -> SAVE: If it has been modified
    if (state.isDirty) {
      try {
        const result = await jawnClient?.POST(
          "/v1/prompt/version/{promptVersionId}/edit-template",
          {
            params: {
              path: {
                promptVersionId: state.version.toString(),
              },
            },
            body: {
              heliconeTemplate: {
                messages: state.messages,
                parameters: state.parameters,
                variables: state.variables,
              },
            },
          }
        );

        if (result?.error) {
          setNotification("Error saving prompt", "error");
          return;
        }

        // Update state with the new version
        setState(prev =>
          prev
            ? {
                ...prev,
                isDirty: false,
              }
            : null
        );

        // Refetch versions
        await refetchPromptVersions();
      } catch (error) {
        console.error("Failed to save state:", error);
        setNotification("Failed to save prompt state", "error");
        return;
      }
    }

    // -> RUN
    try {
      // Create new controller for this stream
      abortController.current = new AbortController();

      const processedMessages = state.messages.map(msg => ({
        role: msg.role as "system" | "user" | "assistant",
        content: replaceVariables(msg.content as string, state.variables || []),
      }));

      try {
        const stream = await generateStream({
          model: state.parameters.model,
          messages: processedMessages,
          temperature: state.parameters.temperature,
          signal: abortController.current.signal,
        });

        await readStream(
          stream,
          (chunk: string) => {
            setState(prev =>
              prev ? { ...prev, response: (prev.response || "") + chunk } : null
            );
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
      return;
    }
  }, [
    state,
    isStreaming,
    canRun,
    jawnClient,
    setNotification,
    refetchPromptVersions,
  ]);

  // useEffect hooks
  useEffect(() => {
    if (!promptVersions || isVersionsLoading) return;

    // Sort versions by version number to get the latest
    const sortedVersions = [...promptVersions].sort(
      (a, b) => b.minor_version - a.minor_version
    );
    const latestVersion = sortedVersions[0];

    if (!latestVersion) return;

    // Parse helicone_template if it's a string, otherwise use as is
    const templateData =
      typeof latestVersion.helicone_template === "string"
        ? JSON.parse(latestVersion.helicone_template)
        : latestVersion.helicone_template;

    // Initialize state with the latest version
    setState({
      promptId: id,
      masterVersion: latestVersion.major_version,
      version: latestVersion.minor_version,
      messages: templateData.messages || [],
      parameters: {
        model: latestVersion.model,
        temperature: templateData.temperature || 0.7,
      },
      variables: templateData.variables || [],
      evals: templateData.evals || [],
      structure: templateData.structure,
      isDirty: false,
    });
  }, [promptVersions, isVersionsLoading, id]);

  // Regular functions
  const handleAddMessagePair = () => {
    if (!canAddMessagePair(state?.messages || [])) return;
    updateState({
      messages: [
        ...(state?.messages || []),
        { role: "assistant", content: "" },
        { role: "user", content: "" },
      ],
    });
  };

  const handleAddPrefill = () => {
    if (
      !state ||
      !canAddPrefill(state.parameters.model) ||
      !canAddPrefillMessage(state.messages)
    )
      return;
    updateState({
      messages: [...state.messages, { role: "assistant", content: "" }],
    });
  };

  // Show loading state while we fetch the prompt and versions
  if (isPromptLoading || isVersionsLoading || !state) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingAnimation title="Loading prompt..." />
      </div>
    );
  }

  return (
    <main className="min-h-screen px-8">
      <Tabs defaultValue="editor">
        {/* Header */}
        <div className="flex flex-row items-center justify-between py-4">
          <HcBreadcrumb
            pages={[
              { href: "/prompts", name: "Prompts" },
              {
                href: `/prompts/${id}`,
                name: prompt?.user_defined_id || "Loading...",
              },
            ]}
          />
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>

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
                canRun ? "text-white opacity-60" : "text-slate-400"
              }`}
            >
              <PiCommandBold className="h-4 w-4" />
              <MdKeyboardReturn className="h-4 w-4" />
            </div>
          </ActionButton>
        </div>

        {/* Prompt Editor */}
        <TabsContent value="editor">
          <ResizablePanels
            leftPanel={
              <PromptPanels
                messages={state.messages}
                onMessageChange={handleMessageChange}
                onAddMessagePair={handleAddMessagePair}
                onAddPrefill={handleAddPrefill}
                canAddPrefill={canAddPrefill(state.parameters.model)}
                onRemoveMessage={handleRemoveMessage}
                onVariableCreate={handleVariableCreate}
                variables={state.variables || []}
              />
            }
            rightPanel={
              <div className="flex h-full flex-col gap-4">
                <ResponsePanel response={state.response || ""} />
              </div>
            }
          />
        </TabsContent>

        {/* Metrics */}
        <TabsContent value="metrics">
          <PromptMetricsTab
            id={id}
            promptUserDefinedId={prompt?.user_defined_id || ""}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default PromptIdPage;
