import { RenderHeliconeRequest } from "@/components/templates/requests/RenderHeliconeRequest";
import RequestDrawerV2 from "@/components/templates/requests/requestDrawerV2";
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
import { HeliconeRequest } from "@/lib/api/request/request";
import { heliconeRequestToMappedContent } from "@/packages/llm-mapper/utils/getMappedContent";
import { ChevronsDownUpIcon, ChevronsUpDownIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { tracesToTreeNodeData } from "../../../../../lib/sessions/helpers";
import { Session } from "../../../../../lib/sessions/sessionTypes";
import { useGetRequests } from "../../../../../services/hooks/requests";
import { Col } from "../../../../layout/common";
import { Row } from "../../../../layout/common/row";
import { TraceSpan } from "../Span";
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
    <>
      <Col className="h-full gap-4">
        {showSpan && (
          <ResizablePanelGroup direction="vertical" className="h-full w-full">
            <ResizablePanel
              defaultSize={40}
              minSize={25}
              className="relative bg-white dark:bg-black h-full"
            >
              <div className="h-full">
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
              </div>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={60} minSize={25}>
              <Row
                className={
                  "h-full border-t border-r border-b border-slate-200 dark:border-slate-800"
                }
              >
                {!isRealtime && (
                  <div
                    className={`flex-shrink-0 ${
                      isRealtime ? "w-full" : "w-[30em]"
                    }`}
                  >
                    <ScrollArea className="h-full">
                      <Col className="border-r border-slate-200 dark:border-slate-700 pb-10">
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
                                    <ChevronsUpDownIcon
                                      width={16}
                                      height={16}
                                    />
                                  ) : (
                                    <ChevronsDownUpIcon
                                      width={16}
                                      height={16}
                                    />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Collapse All</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Tree
                          data={treeData!}
                          className="min-h-[1000px] max-h-screen w-full"
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
                      </Col>
                    </ScrollArea>
                  </div>
                )}
                <ScrollArea className="h-full w-full bg-white dark:bg-black">
                  <div className="flex flex-col gap-5 w-full">
                    <div className="flex-grow [&_.border]:border-none">
                      {displayedRequest && (
                        <RenderHeliconeRequest
                          heliconeRequest={displayedRequest}
                          hideTopBar={isRealtime}
                          realtimeMessageFilter={
                            isRealtime &&
                            !highlighterRange.active &&
                            selectedRequestId
                              ? selectedRequestRole
                              : undefined
                          }
                          messageIndexFilter={messageIndexFilter}
                          key={`${highlighterRange.active}-${highlighterRange.start}-${highlighterRange.end}-${messageIndexFilter?.startIndex}-${messageIndexFilter?.endIndex}`}
                        />
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </Row>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
        {!showSpan && (
          <Row
            className={
              "h-full border-t border-r border-b border-slate-200 dark:border-slate-800"
            }
          >
            {!isRealtime && (
              <div
                className={`flex-shrink-0 ${
                  isRealtime ? "w-full" : "w-[30em]"
                }`}
              >
                <ScrollArea className="h-full">
                  <Col className="border-r border-slate-200 dark:border-slate-700 pb-10">
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
                    <Tree
                      data={treeData!}
                      className="min-h-[1000px] max-h-screen w-full"
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
                  </Col>
                </ScrollArea>
              </div>
            )}
            <ScrollArea className="h-full w-full bg-white dark:bg-black">
              {displayedRequest && (
                <RenderHeliconeRequest
                  heliconeRequest={displayedRequest}
                  hideTopBar={isRealtime}
                  realtimeMessageFilter={
                    isRealtime && !highlighterRange.active && selectedRequestId
                      ? selectedRequestRole
                      : undefined
                  }
                  messageIndexFilter={messageIndexFilter}
                  key={`${highlighterRange.active}-${highlighterRange.start}-${highlighterRange.end}-${messageIndexFilter?.startIndex}-${messageIndexFilter?.endIndex}`}
                />
              )}
            </ScrollArea>
          </Row>
        )}
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
