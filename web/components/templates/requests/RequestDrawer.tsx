import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Muted, P, Small } from "@/components/ui/typography";
import { getJawnClient } from "@/lib/clients/jawn";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import { useCreatePrompt } from "@/services/hooks/prompts/prompts";
import { useQuery } from "@tanstack/react-query";
import { FlaskConicalIcon } from "lucide-react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LuChevronDown,
  LuChevronUp,
  LuPanelRightClose,
  LuPlus,
} from "react-icons/lu";
import { PiPlayBold } from "react-icons/pi";
import {
  addRequestProperty,
  addRequestScore,
} from "../../../services/lib/requests";
import { useOrg } from "../../layout/org/organizationContext";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import { formatNumber } from "../../shared/utils/formatNumber";
import { Badge } from "../../ui/badge";
import NewDataset from "../datasets/NewDataset";
import FeedbackButtons from "../feedback/thumbsUpThumbsDown";
import { RenderMappedRequest } from "./RenderHeliconeRequest";
import ScrollableBadges from "./ScrollableBadges";
import StatusBadge from "./statusBadge";

interface RequestDivProps {
  onCollapse: () => void;
  onNavigate?: (direction: "prev" | "next") => void;
  request?: MappedLLMRequest;
}
export default function RequestDrawer(props: RequestDivProps) {
  const { onCollapse, onNavigate, request } = props;

  const { setNotification } = useNotification();
  const router = useRouter();
  const createPrompt = useCreatePrompt();
  const org = useOrg();
  const jawn = useJawnClient();

  const [showDetails, setShowDetails] = useState(false);
  const [showNewDatasetModal, setShowNewDatasetModal] = useState(false);

  // Prompt Data
  const promptId = useMemo(
    () =>
      request?.heliconeMetadata.customProperties?.["Helicone-Prompt-Id"] ??
      null,
    [request?.heliconeMetadata.customProperties]
  );
  const promptDataQuery = useQuery({
    queryKey: ["prompt", promptId, org?.currentOrg?.id],
    enabled: !!promptId && !!org?.currentOrg?.id,
    queryFn: async (query) => {
      const jawn = getJawnClient(query.queryKey[2]);
      const prompt = await jawn.POST("/v1/prompt/query", {
        body: {
          filter: {
            prompt_v2: {
              user_defined_id: {
                equals: query.queryKey[1],
              },
            },
          },
        },
      });
      return prompt.data?.data?.[0];
    },
  });

  /* -------------------------------------------------------------------------- */
  /*                                    MEMOS                                   */
  /* -------------------------------------------------------------------------- */
  const isChatRequest = useMemo(
    () =>
      request?._type === "openai-chat" ||
      request?._type === "anthropic-chat" ||
      request?._type === "gemini-chat",
    [request]
  );

  // TODO: Maybe these go in the Chat component?
  const requestParameters = useMemo(() => {
    const requestBody = request?.schema.request;
    return {
      max_tokens: requestBody?.max_tokens ?? undefined,
      temperature: requestBody?.temperature ?? undefined,
      top_p: requestBody?.top_p ?? undefined,
      seed: requestBody?.seed ?? undefined,
      stream: requestBody?.stream ?? undefined,
      presence_penalty: requestBody?.presence_penalty ?? undefined,
      frequency_penalty: requestBody?.frequency_penalty ?? undefined,
      stop: requestBody?.stop ?? undefined,
      reasoning_effort: requestBody?.reasoning_effort ?? undefined,
      tools: requestBody?.tools?.map((tool) => tool.name) ?? undefined,
    };
  }, [request]);

  // Get current request Properties and Scores
  const currentProperties = useMemo(
    () =>
      (request?.heliconeMetadata.customProperties as Record<string, string>) ||
      {},
    [request?.heliconeMetadata.customProperties]
  );
  const currentScores = useMemo(
    () => (request?.heliconeMetadata.scores as Record<string, number>) || {},
    [request?.heliconeMetadata.scores]
  );
  // Handlers for adding properties and scores
  const onAddPropertyHandler = useCallback(
    async (key: string, value: string) => {
      if (!org?.currentOrg?.id || !request) {
        setNotification("Error adding label", "error");
        return;
      }

      try {
        const res = await addRequestProperty(
          request.id,
          org.currentOrg.id,
          key,
          value
        );

        if (res?.status === 200) {
          setNotification("Label added", "success");
        } else {
          setNotification("Error adding label", "error");
        }
      } catch (err) {
        console.error(err);
        setNotification(`Error adding label: ${err}`, "error");
      }
    },
    [org?.currentOrg?.id, request, setNotification]
  );
  const onAddScoreHandler = useCallback(
    async (key: string, value: string) => {
      if (!org?.currentOrg?.id || !request) {
        setNotification("Error adding score", "error");
        return;
      }

      let numValue: number;
      if (value === "true") {
        numValue = 1;
      } else if (value === "false") {
        numValue = 0;
      } else {
        numValue = Number(value);
        if (isNaN(numValue)) {
          setNotification("Value must be a number or 'true'/'false'", "error");
          return;
        }
      }

      try {
        const res = await addRequestScore(
          request.id,
          org.currentOrg.id,
          key,
          numValue
        );

        if (res?.status === 201) {
          setNotification("Score added", "success");
        } else {
          setNotification("Error adding score", "error");
        }
      } catch (err) {
        console.error(err);
        setNotification(`Error adding score: ${err}`, "error");
      }
    },
    [org?.currentOrg?.id, request, setNotification]
  );

  // Create experiment handler
  const handleCreateExperiment = useCallback(() => {
    if (!request) return;

    jawn
      .POST("/v2/experiment/create/from-request/{requestId}", {
        params: {
          path: {
            requestId: request.id,
          },
        },
      })
      .then((res) => {
        if (res.error || !res.data.data?.experimentId) {
          setNotification("Failed to create experiment", "error");
          return;
        }
        router.push(`/experiments/${res.data.data?.experimentId}`);
      });
  }, [jawn, request, router, setNotification]);

  // Test prompt handler
  const handleTestPrompt = useCallback(() => {
    if (!request) return;

    if (promptDataQuery.data?.id) {
      router.push(`/prompts/${promptDataQuery.data?.id}`);
    } else {
      router.push(`/prompts/fromRequest/${request.id}`);
    }
  }, [promptDataQuery.data?.id, request, router]);

  // Update keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCollapse();
      } else if (event.key === "ArrowUp" && onNavigate) {
        event.preventDefault();
        onNavigate("prev");
      } else if (event.key === "ArrowDown" && onNavigate) {
        event.preventDefault();
        onNavigate("next");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCollapse, onNavigate]);

  if (!request) {
    return null;
  }

  return (
    <div className="h-full min-h-full w-full flex flex-col">
      {/* Header */}
      <div className="h-fit w-full flex flex-col gap-3 px-3 border-b border-border bg-slate-50 dark:bg-slate-950">
        {/* Top Row */}
        <div className="h-11 w-full shrink-0 flex flex-row justify-between items-center gap-2">
          {/* Left Side */}
          <div className="flex flex-row items-center gap-3">
            {/* Hide Drawer */}
            <Button
              variant={"none"}
              size={"square_icon"}
              className="w-fit"
              onClick={onCollapse}
            >
              <LuPanelRightClose className="w-4 h-4" />
            </Button>
            {/* Model Name */}
            <P className="font-medium text-secondary text-nowrap">
              {request.model}
            </P>
          </div>

          {/* Right Side */}
          <div className="flex flex-row items-center gap-2">
            {/* Duration Badge */}
            <Badge variant={"secondary"} asPill={false}>
              {Number(request.heliconeMetadata.latency) / 1000}s
            </Badge>
            {/* Cost Badge */}
            <Badge variant={"secondary"} asPill={false}>
              ${formatNumber(request.heliconeMetadata.cost || 0)}
            </Badge>
            {/* Status Badge */}
            <StatusBadge
              statusType={request.heliconeMetadata.status.statusType}
              errorCode={request.heliconeMetadata.status.code}
            />

            {/* Show more Parameters Button */}
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    variant={"ghost"}
                    size={"square_icon"}
                    asPill
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? (
                      <LuChevronUp className="w-4 h-4" />
                    ) : (
                      <LuChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {showDetails ? "Hide Details" : "Show Details"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Expandable Details Section */}
        {showDetails && (
          <div className="h-full w-full flex flex-row gap-6 pb-3">
            {/* Request Information */}
            <div className="w-full flex flex-col gap-2">
              <div className="w-full flex flex-col gap-2">
                <div className="w-full flex flex-row gap-2 items-center justify-between">
                  <Muted>Provider</Muted>
                  <Small className="text-right">
                    {request.heliconeMetadata.provider || "Unknown"}
                  </Small>
                </div>
                <div className="w-full flex flex-row gap-2 items-center justify-between">
                  <Muted>Created At</Muted>
                  <Small className="text-right">
                    {new Date(
                      request.heliconeMetadata.createdAt
                    ).toLocaleString()}
                  </Small>
                </div>
                <div className="w-full flex flex-row gap-2 items-center justify-between">
                  <Muted>Request ID</Muted>
                  <Small className="text-right">{request.id}</Small>
                </div>
              </div>
            </div>

            {/* Token Information */}
            <div className="w-full flex flex-col gap-2">
              <div className="w-full flex flex-col gap-2">
                <div className="w-full flex flex-row gap-2 items-center justify-between">
                  <Muted>Input Tokens</Muted>
                  <Small>{request.heliconeMetadata.promptTokens || 0}</Small>
                </div>
                <div className="w-full flex flex-row gap-2 items-center justify-between">
                  <Muted>Output Tokens</Muted>
                  <Small>
                    {request.heliconeMetadata.completionTokens || 0}
                  </Small>
                </div>
                <div className="w-full flex flex-row gap-2 items-center justify-between">
                  <Muted>Total Tokens</Muted>
                  <Small>{request.heliconeMetadata.totalTokens || 0}</Small>
                </div>
              </div>
            </div>

            {/* Request Parameters */}
            {Object.values(requestParameters).some(
              (value) => value !== undefined
            ) && (
              <div className="w-full flex flex-col gap-2">
                {requestParameters.temperature !== undefined && (
                  <div className="w-full flex flex-row gap-2 items-center justify-between">
                    <Muted>Temperature</Muted>
                    <Small>{requestParameters.temperature}</Small>
                  </div>
                )}
                {requestParameters.max_tokens !== undefined && (
                  <div className="w-full flex flex-row gap-2 items-center justify-between">
                    <Muted>Max Tokens</Muted>
                    <Small>{requestParameters.max_tokens}</Small>
                  </div>
                )}
                {requestParameters.top_p !== undefined && (
                  <div className="w-full flex flex-row gap-2 items-center justify-between">
                    <Muted>Top P</Muted>
                    <Small>{requestParameters.top_p}</Small>
                  </div>
                )}
                {requestParameters.seed !== undefined && (
                  <div className="w-full flex flex-row gap-2 items-center justify-between">
                    <Muted>Seed</Muted>
                    <Small>{requestParameters.seed}</Small>
                  </div>
                )}
                {requestParameters.presence_penalty !== undefined && (
                  <div className="w-full flex flex-row gap-2 items-center justify-between">
                    <Muted>Presence Penalty</Muted>
                    <Small>{requestParameters.presence_penalty}</Small>
                  </div>
                )}
                {requestParameters.frequency_penalty !== undefined && (
                  <div className="w-full flex flex-row gap-2 items-center justify-between">
                    <Muted>Frequency Penalty</Muted>
                    <Small>{requestParameters.frequency_penalty}</Small>
                  </div>
                )}
                {requestParameters.reasoning_effort && (
                  <div className="w-full flex flex-row gap-2 items-center justify-between">
                    <Muted>Reasoning Effort</Muted>
                    <Small>{requestParameters.reasoning_effort}</Small>
                  </div>
                )}
                {requestParameters.stream && (
                  <div className="w-full flex flex-row gap-2 items-center justify-between">
                    <Muted>Stream</Muted>
                    <Small>{requestParameters.stream ? "true" : "false"}</Small>
                  </div>
                )}
                {requestParameters.tools &&
                  requestParameters.tools.length > 0 && (
                    <div className="w-full flex flex-row gap-2 items-center justify-between">
                      <Muted>Tools</Muted>
                      <Small className="text-right">
                        {requestParameters.tools.join(", ")}
                      </Small>
                    </div>
                  )}
                {requestParameters.stop && (
                  <div className="w-full flex flex-row gap-2 items-center justify-between">
                    <Muted>Stop Sequences</Muted>
                    <Small className="text-right">
                      {Array.isArray(requestParameters.stop)
                        ? requestParameters.stop.join(", ")
                        : requestParameters.stop}
                    </Small>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mapped Request */}
      <RenderMappedRequest mappedRequest={request} />

      {/* Footer */}
      <div className="w-full flex flex-col gap-2 py-3 border-t border-border">
        {/* Properties and Scores */}
        <div className="w-full flex flex-col gap-2 bg-slate-50 dark:bg-slate-950">
          {/* Properties */}
          <ScrollableBadges
            items={Object.entries(currentProperties).map(([key, value]) => ({
              key,
              value: value as string,
            }))}
            onAdd={onAddPropertyHandler}
            placeholder="No Properties"
            tooltipText="Add a Property to this request"
            tooltipLink={{
              url: "https://docs.helicone.ai/features/advanced-usage/custom-properties",
              text: "Learn about Properties",
            }}
          />

          {/* Scores */}
          <ScrollableBadges
            placeholder="No Scores"
            items={Object.entries(currentScores)
              .filter(([key]) => key !== "helicone-score-feedback")
              .map(([key, value]) => ({ key, value }))}
            onAdd={onAddScoreHandler}
            valueType="number"
            tooltipText="Add a Score to this request"
            tooltipLink={{
              url: "https://docs.helicone.ai/features/advanced-usage/scores",
              text: "Learn about Scores",
            }}
          />
        </div>

        {/* Actions Row */}
        <div className="flex flex-row justify-between items-center gap-2 px-3">
          <div className="flex flex-row items-center gap-2">
            {isChatRequest && (
              <Button
                variant="action"
                size="sm"
                className="flex flex-row items-center gap-1.5"
                onClick={handleTestPrompt}
              >
                <PiPlayBold className="h-4 w-4" />
                Test Prompt
              </Button>
            )}

            {isChatRequest && (
              <Button
                variant="outline"
                size="sm"
                className="flex flex-row items-center gap-1.5"
                onClick={handleCreateExperiment}
              >
                <FlaskConicalIcon className="h-4 w-4" />
                Experiment
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="flex flex-row items-center gap-1.5"
              onClick={() => setShowNewDatasetModal(true)}
            >
              <LuPlus className="h-4 w-4" />
              Dataset
            </Button>
          </div>

          <FeedbackButtons
            requestId={request.id}
            defaultValue={
              request.heliconeMetadata.scores?.["helicone-score-feedback"] === 1
            }
          />
        </div>
      </div>

      {/* Floating Elements */}
      <ThemedModal open={showNewDatasetModal} setOpen={setShowNewDatasetModal}>
        <NewDataset
          request_ids={[request.id]}
          onComplete={() => setShowNewDatasetModal(false)}
        />
      </ThemedModal>
    </div>
  );
}
