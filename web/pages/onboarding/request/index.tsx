import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { useEffect, useState, useRef } from "react";
import { ArrowRight, Loader, Play } from "lucide-react";
import { useOrgOnboarding } from "@/services/hooks/useOrgOnboarding";
import { useOrg } from "@/components/layout/org/organizationContext";
import { H1, Muted } from "@/components/ui/typography";
import { generateStream } from "@/lib/api/llm/generate-stream";
import { processStream } from "@/lib/api/llm/process-stream";
import useNotification from "@/components/shared/notification/useNotification";

const MODELS = [
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "anthropic/claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
];

export default function RequestPage() {
  const org = useOrg();
  const { setNotification } = useNotification();
  const [prompt, setPrompt] = useState("Write a haiku about AI");
  const [selectedModel, setSelectedModel] = useState("openai/gpt-4o-mini");
  const [response, setResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const abortController = useRef<AbortController | null>(null);
  const { updateCurrentStep, updateOnboardingStatus } = useOrgOnboarding(
    org?.currentOrg?.id ?? "",
  );

  useEffect(() => {
    if (org?.currentOrg?.id) {
      updateCurrentStep("REQUEST");
    }
  }, [org?.currentOrg?.id]);

  const onSendRequest = async () => {
    if (!prompt.trim()) {
      setNotification("Please enter a prompt", "error");
      return;
    }

    try {
      setError(null);
      setResponse("");
      setHasCompleted(false);
      setIsStreaming(true);
      abortController.current = new AbortController();

      const requestBody = {
        model: selectedModel,
        messages: [
          {
            role: "user" as const,
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
        logRequest: true,
      };

      const stream = await generateStream({
        ...requestBody,
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
            setResponse(result.fullContent);
          },
        },
        abortController.current.signal,
      );

      if (result && result.error) {
        setError(result.error.message);
        setNotification("Error generating response", "error");
      } else {
        setHasCompleted(true);
        setNotification("Request completed successfully!", "success");
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          setError("Request was cancelled");
        } else {
          console.error("Error:", error);
          setError(
            error.message || "An error occurred while generating the response",
          );
          setNotification(
            error.message || "Failed to generate response",
            "error",
          );
        }
      }
    } finally {
      setIsStreaming(false);
      abortController.current = null;
    }
  };

  const handleViewDashboard = async () => {
    await updateOnboardingStatus({ hasOnboarded: true });
    setIsCompleting(true);
  };

  return (
    <OnboardingHeader>
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
        <div className="flex flex-col gap-2">
          <H1>Send a Request</H1>
          <Muted>
            Try out Helicone with a simple AI request to see it in action.
          </Muted>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            placeholder="Enter your prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 100))}
            maxLength={100}
            disabled={hasCompleted}
          />
          <Muted className="text-xs">{prompt.length}/100 characters</Muted>

          <Select
            value={selectedModel}
            onValueChange={setSelectedModel}
            disabled={hasCompleted}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!hasCompleted && (
            <>
              <Button
                variant="action"
                className="w-full"
                onClick={onSendRequest}
                disabled={!prompt.trim() || isStreaming}
              >
                <>
                  {isStreaming || isCompleting ? (
                    <Loader size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Play size={16} className="mr-2" />
                  )}
                  {isCompleting
                    ? "Skipping..."
                    : isStreaming
                      ? "Generating..."
                      : "Send Request"}
                </>
              </Button>

              <div className="flex justify-end">
                <Muted
                  className="cursor-pointer text-xs hover:underline"
                  onClick={handleViewDashboard}
                >
                  Skip to dashboard
                </Muted>
              </div>
            </>
          )}

          {(response || error) && (
            <div className="w-full rounded-md border border-border bg-muted/50 p-3">
              {error ? (
                <div className="text-sm text-destructive">{error}</div>
              ) : (
                <div className="whitespace-pre-wrap text-sm">
                  {JSON.parse(response).content}
                </div>
              )}
              {isStreaming && (
                <div className="mt-2 flex items-center gap-2">
                  <Loader size={14} className="animate-spin" />
                  <Muted className="text-xs">Streaming...</Muted>
                </div>
              )}
            </div>
          )}

          {hasCompleted && !error && (
            <Button
              variant="action"
              className="w-full"
              onClick={handleViewDashboard}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <>
                  <Loader size={16} className="mr-2 animate-spin" />
                  Completing onboarding...
                </>
              ) : (
                <>
                  View in Dashboard
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </OnboardingHeader>
  );
}
