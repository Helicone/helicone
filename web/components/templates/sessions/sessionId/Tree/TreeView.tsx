import RenderHeliconeRequest from "@/components/templates/requests/RenderHeliconeRequest";
import RequestDrawer from "@/components/templates/requests/RequestDrawer";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HeliconeRequest } from "@/packages/llm-mapper/types";
import { heliconeRequestToMappedContent } from "@/packages/llm-mapper/utils/getMappedContent";
import { ChevronsDownUpIcon, ChevronsUpDownIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { tracesToTreeNodeData } from "../../../../../lib/sessions/helpers";
import { Session } from "../../../../../lib/sessions/sessionTypes";
import { useGetRequests } from "../../../../../services/hooks/requests";
import { Col } from "../../../../layout/common";
import { TraceSpan } from "../Span";
import { Tree } from "./Tree";

// Custom wrapper with specific styling for RenderHeliconeRequest
const RequestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full max-w-full overflow-y-auto overflow-x-hidden">
      <div className="min-w-0">{children}</div>
    </div>
  );
};

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
  const [collapseAll, setCollapseAll] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  // Add state for highlighter range
  const [highlighterRange, setHighlighterRange] = useState<{
    start: number | null;
    end: number | null;
    active: boolean;
  }>({
    start: null,
    end: null,
    active: false,
  });

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

  const treeData = useMemo(() => {
    if (isRealtime) return null;
    return tracesToTreeNodeData(session.traces);
  }, [isRealtime, session.traces]);

  // Handle highlighter range updates
  const handleHighlighterRangeChange = (
    start: number | null,
    end: number | null,
    active: boolean
  ) => {
    setHighlighterRange({ start, end, active });
  };

  // Determine message index filter based on highlighter or single message selection
  const messageIndexFilter = useMemo(() => {
    if (isRealtime) {
      if (
        highlighterRange.active &&
        highlighterRange.start !== null &&
        highlighterRange.end !== null
      ) {
        // When highlighter is active, use its range
        return {
          startIndex: highlighterRange.start,
          endIndex: highlighterRange.end,
          isHighlighterActive: true,
        };
      } else if (
        !highlighterRange.active &&
        highlighterRange.start !== null &&
        highlighterRange.end !== null &&
        highlighterRange.start === highlighterRange.end
      ) {
        // When a single message is selected (start and end are the same)
        return {
          startIndex: highlighterRange.start,
          endIndex: highlighterRange.start,
          isHighlighterActive: false,
        };
      }
    }
    return undefined;
  }, [isRealtime, highlighterRange]);

  return (
    <Col className="h-full">
      {showSpan && (
        <ResizablePanelGroup direction="vertical" className="h-full w-full">
          <ResizablePanel
            defaultSize={40}
            minSize={25}
            className="relative bg-white dark:bg-black"
          >
            <TraceSpan
              session={session}
              selectedRequestIdDispatch={[
                selectedRequestId,
                setSelectedRequestId,
              ]}
              height="100%"
              realtimeData={realtimeData}
              onHighlighterChange={handleHighlighterRangeChange}
            />
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={60} minSize={25}>
            <div className="h-full border-t border-slate-200 dark:border-slate-800 flex">
              {!isRealtime && (
                <div className="flex-shrink-0 w-[30em] h-full">
                  <ScrollArea className="h-full">
                    <div className="border-r border-slate-200 dark:border-slate-700 pb-10">
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
                            <TooltipContent>
                              {collapseAll ? "Expand All" : "Collapse All"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Tree
                        data={treeData!}
                        className="min-h-[1000px] w-full"
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
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="flex-grow h-full overflow-auto">
                {displayedRequest && (
                  <RequestWrapper>
                    <RenderHeliconeRequest
                      heliconeRequest={displayedRequest}
                      messageIndexFilter={messageIndexFilter}
                      key={`${highlighterRange.active}-${highlighterRange.start}-${highlighterRange.end}-${messageIndexFilter?.startIndex}-${messageIndexFilter?.endIndex}`}
                    />
                  </RequestWrapper>
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}

      {!showSpan && (
        <div className="h-full border-t border-r border-b border-slate-200 dark:border-slate-800 flex">
          {!isRealtime && (
            <div className="flex-shrink-0 w-[30em] h-full">
              <ScrollArea className="h-full">
                <div className="border-r border-slate-200 dark:border-slate-700 pb-10">
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
                        <TooltipContent>
                          {collapseAll ? "Expand All" : "Collapse All"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Tree
                    data={treeData!}
                    className="min-h-[1000px] w-full"
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
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="flex-grow h-full overflow-auto">
            {displayedRequest && (
              <RequestWrapper>
                <RenderHeliconeRequest
                  heliconeRequest={displayedRequest}
                  messageIndexFilter={messageIndexFilter}
                  key={`${highlighterRange.active}-${highlighterRange.start}-${highlighterRange.end}-${messageIndexFilter?.startIndex}-${messageIndexFilter?.endIndex}`}
                />
              </RequestWrapper>
            )}
          </div>
        </div>
      )}

      {!isRealtime && showDrawer && requestIdToShow && displayedRequest && (
        <RequestDrawer
          request={heliconeRequestToMappedContent(displayedRequest)}
          onCollapse={() => setShowDrawer(false)}
        />
      )}
    </Col>
  );
};

export default TreeView;
