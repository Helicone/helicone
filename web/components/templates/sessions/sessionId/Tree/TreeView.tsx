import { RenderHeliconeRequest } from "@/components/templates/requests/RenderHeliconeRequest";
import RequestDrawerV2 from "@/components/templates/requests/requestDrawerV2";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HeliconeRequest } from "@/lib/api/request/request";
import { Message } from "@/packages/llm-mapper/types";
import { heliconeRequestToMappedContent } from "@/packages/llm-mapper/utils/getMappedContent";
import {
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  ExpandIcon,
  ShrinkIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { tracesToTreeNodeData } from "../../../../../lib/sessions/helpers";
import { Session } from "../../../../../lib/sessions/sessionTypes";
import { useGetRequests } from "../../../../../services/hooks/requests";
import { Col } from "../../../../layout/common";
import { Row } from "../../../../layout/common/row";
import { TraceSpan } from "../Span";
import { RealtimeTurnNode } from "./RealtimeNode";
import { Tree } from "./Tree";

interface TreeViewProps {
  session: Session;
  selectedRequestId: string;
  setSelectedRequestId: (id: string) => void;
  showSpan: boolean;
  requests: ReturnType<typeof useGetRequests>;
  realtimeData: {
    isRealtime: boolean;
    effectiveRequests: HeliconeRequest[];
    originalRequest: HeliconeRequest | null;
  };
}

const TreeView: React.FC<TreeViewProps> = ({
  session,
  selectedRequestId,
  setSelectedRequestId,
  requests,
  showSpan,
  realtimeData,
}) => {
  const [expandSpan, setExpandSpan] = useState(false);
  const [collapseAll, setCollapseAll] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedTurnIndex, setSelectedTurnIndex] = useState<number | null>(
    null
  );

  const { isRealtime, effectiveRequests, originalRequest } = realtimeData;

  // Find the request to display based on the selected ID
  const requestIdToShow = useMemo(() => {
    if (selectedRequestId) {
      return selectedRequestId;
    }

    // For realtime sessions, default to the first simulated request
    if (isRealtime && effectiveRequests.length > 0) {
      return effectiveRequests[0].request_id;
    }

    // Otherwise use the first request from the session
    return session.traces?.[0]?.request_id ?? null;
  }, [selectedRequestId, isRealtime, effectiveRequests, session]);

  const onBoardingRequestTrace = useMemo(
    () =>
      session.traces.find((t) => t.path === "/planning/extract-travel-plan"),
    [session.traces]
  );

  // Find the actual request to display
  const displayedRequest = useMemo(() => {
    if (isRealtime && session.traces.length > 0) {
      // For realtime sessions, use the original request if available
      if (originalRequest) {
        return originalRequest;
      }

      // Fallback to the first effective request
      return effectiveRequests[0];
    }

    // For normal sessions, find the request by ID
    return effectiveRequests.find((r) => r.request_id === requestIdToShow);
  }, [
    effectiveRequests,
    requestIdToShow,
    isRealtime,
    session.traces,
    originalRequest,
  ]);
  const selectedRequestRole =
    isRealtime && requestIdToShow
      ? effectiveRequests.find((r) => r.request_id === requestIdToShow)
          ?.properties?._helicone_realtime_role
      : undefined;
  const conversationTurns = useMemo(() => {
    if (!isRealtime || !originalRequest) return [];

    // Get all messages from the original realtime request
    const mappedContent = heliconeRequestToMappedContent(originalRequest);
    const allMessages = [
      ...(mappedContent.schema.request?.messages || []),
      ...(mappedContent.schema.response?.messages || []),
    ].sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeA - timeB;
    });

    // Group messages into turns based on role changes - EXACTLY matching the logic in realtimeSession.ts
    const turns: Message[][] = [];
    let currentTurn: Message[] = [];
    let currentRole = "";

    allMessages.forEach((message) => {
      // Skip messages without roles completely (they won't form turns)
      if (!message.role) return;

      // If role changes or this is the first message, start a new turn
      if (
        currentRole !== message.role ||
        currentRole === "" ||
        turns.length === 0
      ) {
        if (currentTurn.length > 0) {
          turns.push(currentTurn);
        }
        currentTurn = [message];
        currentRole = message.role;
      } else {
        // Continue current turn with same role
        currentTurn.push(message);
      }
    });

    // Add the last turn
    if (currentTurn.length > 0) {
      turns.push(currentTurn);
    }

    return turns;
  }, [isRealtime, originalRequest]);
  const treeData = useMemo(() => {
    if (isRealtime) return null;
    return tracesToTreeNodeData(session.traces);
  }, [isRealtime, session.traces]);

  return (
    <>
      <Col className="h-full gap-4">
        {showSpan && (
          <div className="h-full relative">
            <TraceSpan
              session={session}
              selectedRequestIdDispatch={[
                selectedRequestId,
                setSelectedRequestId,
              ]}
              height={expandSpan ? "100%" : "200px"}
              realtimeData={realtimeData}
              selectedTurnIndexDispatch={
                isRealtime
                  ? [selectedTurnIndex, setSelectedTurnIndex]
                  : undefined
              }
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute top-3 right-3 glass"
              onClick={() => setExpandSpan(!expandSpan)}
            >
              {expandSpan ? (
                <ShrinkIcon
                  width={16}
                  height={16}
                  className="text-slate-900 dark:text-slate-200"
                />
              ) : (
                <ExpandIcon
                  width={16}
                  height={16}
                  className="text-slate-900 dark:text-slate-200"
                />
              )}
            </Button>
          </div>
        )}
        <Row
          className={
            "h-full bg-slate-50 dark:bg-black border-t border-r border-b border-slate-200 dark:border-slate-700"
          }
        >
          <div className="flex-shrink-0 w-[30em]">
            <ScrollArea className="h-full">
              <Col className="border-r border-slate-200 dark:border-slate-700 pb-10">
                {!isRealtime && (
                  <div className="w-full bg-slate-50 dark:bg-black flex justify-end h-10">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            className="rounded-none"
                            variant="ghost"
                            size="icon"
                            onClick={() => setCollapseAll(!collapseAll)}
                          >
                            {collapseAll ? (
                              <ChevronsUpDownIcon width={16} height={16} />
                            ) : (
                              <ChevronsDownUpIcon width={16} height={16} />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Collapse All</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}

                {/* Render based on whether this is a realtime session or not */}
                {isRealtime ? (
                  /* For realtime sessions, show only conversation turns */
                  <div className="h-full flex flex-col">
                    <div className="sticky top-0 flex items-center p-4 glass border-b border-slate-200 dark:border-slate-800">
                      <h2 className="text-sm font-semibold text-secondary">
                        Conversation Turns
                      </h2>
                    </div>
                    <div className="">
                      {conversationTurns.length > 0 ? (
                        conversationTurns.map((turn, i) => (
                          <RealtimeTurnNode
                            key={i}
                            turnIndex={i}
                            turn={turn}
                            isSelected={selectedTurnIndex === i}
                            onClick={() => {
                              setSelectedTurnIndex(i);
                              setSelectedRequestId("");
                            }}
                          />
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                          No conversation turns found
                        </div>
                      )}
                      {/* Add spacing at the bottom to ensure scrolling captures the last item */}
                      <div className="h-10"></div>
                    </div>
                  </div>
                ) : (
                  /* For regular sessions, show the tree view */
                  <Tree
                    data={treeData!}
                    className="min-h-[1000px] max-h-screen"
                    selectedRequestIdDispatch={[
                      selectedRequestId,
                      setSelectedRequestId,
                    ]}
                    collapseAll={collapseAll}
                    setShowDrawer={setShowDrawer}
                    onBoardingRequestTrace={onBoardingRequestTrace}
                    sessionId={session.session_id}
                    realtimeData={realtimeData}
                  />
                )}
              </Col>
            </ScrollArea>
          </div>
          <ScrollArea className="h-full w-full bg-white dark:bg-black">
            <div className="flex flex-col gap-5 w-full">
              <div className="flex-grow [&_.border]:border-none p-4">
                {displayedRequest && (
                  <RenderHeliconeRequest
                    heliconeRequest={displayedRequest}
                    hideTopBar={isRealtime}
                    realtimeMessageFilter={
                      isRealtime &&
                      selectedTurnIndex === null &&
                      selectedRequestId
                        ? selectedRequestRole
                        : undefined
                    }
                    messageIndexFilter={
                      isRealtime && selectedTurnIndex !== null
                        ? {
                            startIndex:
                              conversationTurns.length > 0
                                ? Math.min(
                                    selectedTurnIndex,
                                    conversationTurns.length - 1
                                  )
                                : 0,
                          }
                        : undefined
                    }
                  />
                )}
              </div>
            </div>
          </ScrollArea>
        </Row>
      </Col>
      {!isRealtime && showDrawer && requestIdToShow && displayedRequest && (
        <RequestDrawerV2
          open={showDrawer}
          setOpen={setShowDrawer}
          request={heliconeRequestToMappedContent(displayedRequest)}
          properties={[]}
        />
      )}
    </>
  );
};

export default TreeView;
