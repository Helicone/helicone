import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { P, XSmall } from "@/components/ui/typography";
import { getJawnClient } from "@/lib/clients/jawn";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { logger } from "@/lib/telemetry/logger";
import { MappedLLMRequest } from "@helicone-package/llm-mapper/types";
import { useGetPromptInputs } from "@/services/hooks/prompts";
import { useLocalStorage } from "@/services/hooks/localStorage";
import { formatDate } from "@/utils/date";
import { useQuery } from "@tanstack/react-query";
import {
  Eye,
  ListTreeIcon,
  ScrollTextIcon,
  ShuffleIcon,
  Share2,
  UserIcon,
} from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LuChevronDown,
  LuChevronUp,
  LuCopy,
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
import FeedbackAction from "../feedback/thumbsUpThumbsDown";
import { RenderMappedRequest } from "./RenderHeliconeRequest";
import ScrollableBadges from "./ScrollableBadges";
import StatusBadge from "./statusBadge";
import { getUSDateFromString } from "@/components/shared/utils/utils";
import { JsonRenderer } from "./components/chatComponent/single/JsonRenderer";
import { useGetPromptVersion } from "@/services/hooks/prompts";
import PromptVersionPill from "@/components/templates/prompts2025/PromptVersionPill";
import { EMPTY_SESSION_NAME } from "../sessions/sessionId/SessionContent";

const RequestDescTooltip = (props: {
  displayText: string;
  icon: React.ReactNode;
  href?: string;
  copyText?: string;
  truncateLength?: number;
}) => {
  const { displayText, icon, copyText, href, truncateLength = 18 } = props;
  const { setNotification } = useNotification();
  return (
    <TooltipProvider>
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>
          <div className="-ml-1 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-secondary hover:bg-accent">
            {icon}
            <XSmall>
              <span className="truncate">
                {displayText.length > truncateLength
                  ? displayText.slice(0, truncateLength) + "..."
                  : displayText}
              </span>
            </XSmall>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="ml-2 p-0">
          <div className="flex w-full flex-col">
            {copyText && (
              <button
                className="flex items-center justify-between gap-2 p-2 text-left hover:bg-accent"
                onClick={() => {
                  navigator.clipboard.writeText(copyText);
                  setNotification("Copied to clipboard", "success");
                }}
              >
                <span className="text-xs">Copy ID</span>
                <LuCopy className="h-3 w-3" />
              </button>
            )}
            {href && (
              <Link
                href={href}
                className="flex items-center justify-between gap-2 p-2 text-left hover:bg-accent"
              >
                <span className="text-xs">View</span>
                <Eye className="h-3 w-3" />
              </Link>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface RequestDivProps {
  onCollapse: () => void;
  onNavigate?: (direction: "prev" | "next") => void;
  request?: MappedLLMRequest;
  showCollapse?: boolean;
  onRequestSelect?: (request_id: string) => void;
}
export default function RequestDrawer(props: RequestDivProps) {
  const {
    onCollapse,
    onNavigate,
    request,
    showCollapse = true,
    onRequestSelect,
  } = props;

  const { setNotification } = useNotification();
  const org = useOrg();

  const [showDetails, setShowDetails] = useLocalStorage(
    "request-drawer-details",
    false,
  );
  const [showNewDatasetModal, setShowNewDatasetModal] = useState(false);

  // NEW PROMPTS SYSTEM (2025)
  const newPromptId = useMemo(
    () => request?.heliconeMetadata.promptId ?? null,
    [request?.heliconeMetadata.promptId],
  );
  const newPromptVersionId = useMemo(
    () => request?.heliconeMetadata.promptVersion ?? null,
    [request?.heliconeMetadata.promptVersion],
  );

  const currentPromptData = useGetPromptVersion(
    newPromptVersionId || undefined,
    false,
  );

  const promptInputsQuery = useGetPromptInputs(
    newPromptId || "",
    newPromptVersionId || "",
    request?.id || "",
  );

  // BACKWARDS COMPATABILITY FOR OLD PROMPTS
  const legacyPromptId = useMemo(
    () =>
      request?.heliconeMetadata.customProperties?.["Helicone-Prompt-Id"] ??
      null,
    [request?.heliconeMetadata.customProperties],
  );
  const promptDataQuery = useQuery({
    queryKey: ["prompt", legacyPromptId, org?.currentOrg?.id],
    enabled: !!legacyPromptId && !!org?.currentOrg?.id,
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
      request?._type === "ai-gateway" ||
      request?._type === "openai-chat" ||
      request?._type === "anthropic-chat" ||
      request?._type === "gemini-chat",
    [request],
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
      tools: requestBody?.tools?.length
        ? requestBody.tools.map((tool) => tool.name)
        : undefined,
    };
  }, [request]);

  // Organized request details for rendering
  const requestDetails = useMemo(() => {
    if (!request) return { requestInfo: [], tokenInfo: [], parameterInfo: [] };

    // Request Information
    const requestInfo = [
      {
        label: "Provider",
        value: request.heliconeMetadata.provider || "Unknown",
      },
      {
        label: "Created At",
        value: formatDate(request.heliconeMetadata.createdAt),
        fullValue: getUSDateFromString(
          request.heliconeMetadata.createdAt,
          true,
        ),
      },
      { label: "Request ID", value: request.id },
      { label: "User", value: request.heliconeMetadata.user || "Unknown" },
    ];

    // Token Information
    const tokenInfo = [
      {
        label: "Input Tokens",
        value: request.heliconeMetadata.promptTokens || 0,
      },
      {
        label: "Output Tokens",
        value: request.heliconeMetadata.completionTokens || 0,
      },
      {
        label: "Total Tokens",
        value: request.heliconeMetadata.totalTokens || 0,
      },
      ...(request.heliconeMetadata.path
        ? [
            {
              label: "Path",
              value: request.heliconeMetadata.path,
            },
          ]
        : []),
      ...(request.heliconeMetadata.promptCacheReadTokens &&
      request.heliconeMetadata.promptCacheReadTokens > 0
        ? [
            {
              label: "Prompt Cache Read Tokens",
              value: request.heliconeMetadata.promptCacheReadTokens || 0,
            },
          ]
        : []),
      ...(request.heliconeMetadata.promptCacheWriteTokens &&
      request.heliconeMetadata.promptCacheWriteTokens > 0
        ? [
            {
              label: "Prompt Cache Write Tokens",
              value: request.heliconeMetadata.promptCacheWriteTokens || 0,
            },
          ]
        : []),
    ];

    // Parameter Information (only include defined parameters)
    const parameterInfo = Object.entries(requestParameters)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => {
        // Format special values
        let displayValue = value;
        if (key === "stream") {
          displayValue = value ? "true" : "false";
        } else if (key === "tools" && Array.isArray(value)) {
          displayValue = value.join(", ");
        } else if (key === "stop") {
          displayValue = Array.isArray(value) ? value.join(", ") : value;
        }

        return {
          label: key
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          value: displayValue,
          align: ["tools", "stop"].includes(key) ? "right" : "left",
        };
      });

    return { requestInfo, tokenInfo, parameterInfo };
  }, [request, requestParameters]);

  // Create experiment handler - commented out as unused
  /*const handleCreateExperiment = useCallback(() => {
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
  }, [jawn, request, router, setNotification]);*/

  // TODO: Delete legacy prompts code
  const hasNewPromptData = useMemo(
    () =>
      newPromptId &&
      newPromptVersionId &&
      promptInputsQuery.data &&
      promptInputsQuery.data !== null,
    [newPromptId, newPromptVersionId, promptInputsQuery.data],
  );
  const hasLegacyPromptData = useMemo(
    () => legacyPromptId && promptDataQuery.data?.id,
    [legacyPromptId, promptDataQuery.data?.id],
  );

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

  // Get Helicone Special Properties
  const specialProperties = useMemo(() => {
    return {
      userId: request?.heliconeMetadata.user ?? undefined,
      promptId:
        // prioritize new prompt system over legacy
        newPromptId ??
        request?.heliconeMetadata.customProperties?.["Helicone-Prompt-Id"] ??
        undefined,
      sessionId:
        request?.heliconeMetadata.customProperties?.["Helicone-Session-Id"] ??
        undefined,
      sessionName:
        request?.heliconeMetadata.customProperties?.["Helicone-Session-Name"] ??
        undefined,
      sessionPath:
        request?.heliconeMetadata.customProperties?.["Helicone-Session-Path"] ??
        undefined,
      gatewayRouterId: request?.heliconeMetadata.gatewayRouterId ?? undefined,
      gatewayDeploymentTarget:
        request?.heliconeMetadata.gatewayDeploymentTarget ?? undefined,
    } as Record<string, string | undefined>;
  }, [request?.heliconeMetadata.customProperties, newPromptId]);

  // Get current request Properties and Scores
  const currentProperties = useMemo(() => {
    const properties =
      (request?.heliconeMetadata.customProperties as Record<string, string>) ||
      {};
    // Filter out specific Helicone special keys, and leave out only custom properties
    return Object.fromEntries(
      Object.entries(properties).filter(
        ([key]) =>
          ![
            "Helicone-Session-Id",
            "Helicone-Session-Name",
            "Helicone-Session-Path",
            "Helicone-Prompt-Id",
            "Helicone-User-Id",
          ].includes(key),
      ),
    );
  }, [request?.heliconeMetadata.customProperties]);
  const currentScores = useMemo(
    () => (request?.heliconeMetadata.scores as Record<string, number>) || {},
    [request?.heliconeMetadata.scores],
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
          value,
        );

        if (res?.status === 200) {
          setNotification("Label added", "success");
        } else {
          setNotification("Error adding label", "error");
        }
      } catch (err) {
        logger.error(
          {
            error: err,
          },
          "Failed to add request property",
        );
        setNotification(`Error adding label: ${err}`, "error");
      }
    },
    [org?.currentOrg?.id, request, setNotification],
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
          numValue,
        );

        if (res?.status === 201) {
          setNotification("Score added", "success");
        } else {
          setNotification("Error adding score", "error");
        }
      } catch (err) {
        logger.error(
          {
            error: err,
          },
          "Failed to add request property",
        );
        setNotification(`Error adding score: ${err}`, "error");
      }
    },
    [org?.currentOrg?.id, request, setNotification],
  );

  // Tracking the width of the container holding the 3 RequestDescTooltips to dynamically truncate length
  const [descContainerWidth, setDescContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDescContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef.current]);

  const MINIMUM_TRUNCATE_LENGTH = 3;
  const MAXIMUM_TRUNCATE_LENGTH = 30;
  const CHARACTER_WIDTH = 4;
  const ITEM_COUNT = 3;
  const RESERVED_WIDTH = 300;
  const dynamicTruncateLength = useMemo(() => {
    const availableWidth = descContainerWidth - RESERVED_WIDTH;
    const approximateCharsPerItem = Math.floor(
      availableWidth / (ITEM_COUNT * CHARACTER_WIDTH),
    );
    return Math.max(
      MINIMUM_TRUNCATE_LENGTH,
      Math.min(approximateCharsPerItem, MAXIMUM_TRUNCATE_LENGTH),
    );
  }, [descContainerWidth]);

  if (!request) {
    return null;
  } else
    return (
      <section className="flex h-full min-h-full w-full flex-col">
        {/* Header */}
        <header className="flex h-fit w-full flex-col border-b border-border bg-card pt-2">
          {/* First Top Row */}
          <div className="flex h-8 w-full shrink-0 flex-row items-center justify-between gap-2 px-2">
            {/* Left Side */}
            <div className="flex flex-row items-center gap-3 overflow-hidden">
              {/* Hide Drawer */}
              {showCollapse && (
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={"none"}
                        size={"square_icon"}
                        className="w-fit pl-2 text-muted-foreground hover:text-primary"
                        onClick={onCollapse}
                      >
                        <LuPanelRightClose className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Collapse Drawer
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {/* Model Name */}
              <P className="truncate text-nowrap font-medium text-secondary">
                {request.model}
              </P>
            </div>

            {/* Right Side */}
            <div className="flex flex-row items-center gap-2">
              {/* Duration Badge */}
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Badge variant={"secondary"} asPill={false}>
                      {Number(request.heliconeMetadata.latency) / 1000}s
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Latency
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Cost Badge */}
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Badge variant={"secondary"} asPill={false}>
                      ${formatNumber(request.heliconeMetadata.cost || 0)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Cost
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

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
                      className=""
                      asPill
                      onClick={() => setShowDetails(!showDetails)}
                    >
                      {showDetails ? (
                        <LuChevronUp className="h-4 w-4" />
                      ) : (
                        <LuChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {showDetails ? "Hide Details" : "Show Details"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Second Top Row */}
          {Object.values(specialProperties).some((value) => value) && (
            <div
              ref={containerRef}
              className="flex h-8 w-full shrink-0 flex-row items-center gap-2 px-2.5"
            >
              {/* User */}
              {specialProperties.userId && (
                <RequestDescTooltip
                  displayText={specialProperties.userId}
                  icon={<UserIcon className="h-4 w-4" />}
                  copyText={specialProperties.userId}
                  href={`/users/${specialProperties.userId}`}
                  truncateLength={dynamicTruncateLength}
                />
              )}

              {/* Session */}
              {specialProperties.sessionId && (
                <RequestDescTooltip
                  displayText={
                    specialProperties.sessionPath ??
                    specialProperties.sessionName ??
                    specialProperties.sessionId
                  }
                  icon={<ListTreeIcon className="h-4 w-4" />}
                  copyText={specialProperties.sessionId}
                  href={`/sessions/${encodeURIComponent(
                    specialProperties.sessionName ?? EMPTY_SESSION_NAME,
                  )}/${specialProperties.sessionId}`}
                  truncateLength={dynamicTruncateLength}
                />
              )}

              {/* Prompt */}
              {specialProperties.promptId && (
                <RequestDescTooltip
                  displayText={
                    currentPromptData?.data?.prompt?.name ||
                    specialProperties.promptId
                  }
                  icon={<ScrollTextIcon className="h-4 w-4" />}
                  copyText={specialProperties.promptId}
                  href={
                    newPromptId
                      ? `/prompts`
                      : `/prompts/${promptDataQuery.data?.id}`
                  }
                  truncateLength={dynamicTruncateLength}
                />
              )}

              {/* Gateway Router ID */}
              {specialProperties.gatewayRouterId && (
                <RequestDescTooltip
                  displayText={specialProperties.gatewayRouterId}
                  icon={<ShuffleIcon className="h-4 w-4" />}
                  copyText={specialProperties.gatewayRouterId}
                  href={`/gateway/${specialProperties.gatewayRouterId}`}
                  truncateLength={dynamicTruncateLength}
                />
              )}
            </div>
          )}

          {/* Expandable Details Section */}
          {showDetails && (
            <div className="flex h-full w-full flex-col gap-4 border-b border-border pb-4 pt-2">
              <div className="flex w-full flex-row justify-between gap-8 px-4">
                {/* Request Information */}
                <div className="flex w-full flex-col gap-2">
                  {requestDetails.requestInfo.map((item) => (
                    <div
                      key={item.label}
                      className="grid grid-cols-[auto,1fr] items-center gap-x-4"
                    >
                      <XSmall className="text-nowrap text-muted-foreground">
                        {item.label}
                      </XSmall>

                      {item.label === "Request ID" || item.label === "User" ? (
                        <TooltipProvider>
                          <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                              <p
                                className="min-w-0 cursor-pointer truncate text-right text-xs"
                                onClick={() => {
                                  navigator.clipboard.writeText(item.value);
                                  setNotification(
                                    "Request ID copied",
                                    "success",
                                  );
                                }}
                              >
                                {item.value}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              Copy
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : item.label === "Created At" ? (
                        <TooltipProvider>
                          <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                              <p className="min-w-0 cursor-pointer truncate text-right text-xs">
                                {item.value}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              {item.fullValue}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <p className="min-w-0 truncate text-right text-xs">
                          {item.value}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Token Information */}
                <div className="flex w-full flex-col gap-2">
                  {requestDetails.tokenInfo.map((item) => (
                    <div
                      key={item.label}
                      className="grid grid-cols-[auto,1fr] items-center gap-x-4"
                    >
                      <XSmall className="text-nowrap text-muted-foreground">
                        {item.label}
                      </XSmall>
                      <XSmall className="min-w-0 truncate text-right">
                        {item.value}
                      </XSmall>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </header>

        <div className="h-full w-full overflow-auto">
          {/* Request Parameters - Moved out of header */}
          {showDetails && requestDetails.parameterInfo.length > 0 && (
            <div className="flex w-full flex-col gap-2 border-b border-border bg-card px-4 py-3">
              {requestDetails.parameterInfo.map((item) => (
                <div
                  key={item.label}
                  className="grid grid-cols-[auto,1fr] items-start gap-x-4"
                >
                  <XSmall className="text-nowrap text-muted-foreground">
                    {item.label}
                  </XSmall>
                  <XSmall className="min-w-0 truncate text-right">
                    {item.value}
                  </XSmall>
                </div>
              ))}
            </div>
          )}

          {/* Properties and Scores */}
          <div className="flex w-full flex-col divide-y divide-border border-b border-border bg-card">
            {/* Properties */}
            <ScrollableBadges
              className="px-4"
              title="Properties"
              placeholder="No Properties"
              items={Object.entries(currentProperties).map(([key, value]) => ({
                key,
                value: value as string,
              }))}
              onAdd={onAddPropertyHandler}
              tooltipText="Add a Property to this request"
              tooltipLink={{
                url: "https://docs.helicone.ai/features/advanced-usage/custom-properties",
                text: "Learn about Properties",
              }}
            />

            {/* Scores */}
            <ScrollableBadges
              className="px-4"
              title="Scores"
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

          <div className="h-full w-full overflow-auto bg-card p-3">
            {hasNewPromptData && promptInputsQuery.data && (
              <div className="mb-4 rounded-lg border border-border bg-sidebar-background">
                <div className="flex h-12 flex-row items-center justify-between rounded-t-lg bg-white p-4 pr-2 shadow-sm dark:bg-black">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium">Prompt Input</h2>
                    {currentPromptData?.data?.prompt?.name && (
                      <>
                        <div className="h-4 w-px bg-border" />
                        <span className="text-sm font-medium text-muted-foreground">
                          {currentPromptData.data.prompt.name.length > 15
                            ? currentPromptData.data.prompt.name.substring(
                                0,
                                12,
                              ) + "..."
                            : currentPromptData.data.prompt.name}
                        </span>
                      </>
                    )}
                    {currentPromptData?.data?.promptVersion && (
                      <PromptVersionPill
                        majorVersion={
                          currentPromptData.data.promptVersion.major_version
                        }
                        minorVersion={
                          currentPromptData.data.promptVersion.minor_version
                        }
                      />
                    )}
                  </div>
                  <Link
                    href={`/playground?promptVersionId=${newPromptVersionId}`}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex flex-row items-center gap-1.5"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </Link>
                </div>
                <div className="max-h-60 overflow-auto border-t border-border bg-sidebar-background p-4 text-sm">
                  <JsonRenderer
                    data={JSON.parse(
                      JSON.stringify(promptInputsQuery.data?.inputs),
                    )}
                  />
                </div>
              </div>
            )}

            {/* Mapped Request */}
            <RenderMappedRequest
              mappedRequest={request}
              onRequestSelect={onRequestSelect}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="flex w-full flex-col gap-2 border-t border-border bg-card py-3">
          {/* Actions Row */}
          <div className="flex flex-row items-center justify-between gap-2 px-3">
            <div className="flex flex-row items-center gap-2">
              {isChatRequest && (
                <Link href={`/playground?requestId=${request.id}`}>
                  <Button
                    variant="action"
                    size="sm"
                    className="flex flex-row items-center gap-1.5"
                  >
                    <PiPlayBold className="h-4 w-4" />
                    {hasNewPromptData || hasLegacyPromptData
                      ? "Test Prompt"
                      : "Playground"}
                  </Button>
                </Link>
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

              {/* Share link */}
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={"ghost"}
                      size={"square_icon"}
                      onClick={() => {
                        try {
                          const url = new URL(window.location.href);
                          url.searchParams.set("requestId", request.id);
                          navigator.clipboard.writeText(url.toString());
                          setNotification("Share URL copied", "success");
                        } catch (e) {
                          setNotification("Failed to copy link", "error");
                        }
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Copy share link
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <FeedbackAction
              id={request.id}
              type="request"
              defaultValue={
                request.heliconeMetadata.scores &&
                request.heliconeMetadata.scores["helicone-score-feedback"]
                  ? Number(
                      request.heliconeMetadata.scores[
                        "helicone-score-feedback"
                      ],
                    ) === 1
                    ? true
                    : false
                  : null
              }
            />
          </div>
        </footer>

        {/* Floating Elements */}
        <ThemedModal
          open={showNewDatasetModal}
          setOpen={setShowNewDatasetModal}
        >
          <NewDataset
            request_ids={[request.id]}
            onComplete={() => setShowNewDatasetModal(false)}
          />
        </ThemedModal>
      </section>
    );
}
