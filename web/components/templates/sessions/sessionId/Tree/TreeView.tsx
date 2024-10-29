import { useState } from "react";
import { tracesToTreeNodeData } from "../../../../../lib/sessions/helpers";
import { Session } from "../../../../../lib/sessions/sessionTypes";
import { Row } from "../../../../layout/common/row";
import getNormalizedRequest from "../../../requestsV2/builder/requestBuilder";
import { TraceSpan } from "../Span";
import { Tree } from "./Tree";
import { useGetRequests } from "../../../../../services/hooks/requests";
import { Col } from "../../../../layout/common";
import { Button } from "@/components/ui/button";
import {
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  ExpandIcon,
  ShrinkIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import RequestDrawerV2 from "@/components/templates/requestsV2/requestDrawerV2";

import { ScrollArea } from "@/components/ui/scroll-area";

interface TreeViewProps {
  session: Session;
  selectedRequestId: string;
  setSelectedRequestId: (id: string) => void;
  requests: ReturnType<typeof useGetRequests>;
  showSpan: boolean;
}

const TreeView: React.FC<TreeViewProps> = ({
  session,
  selectedRequestId,
  setSelectedRequestId,
  requests,
  showSpan,
}) => {
  const [expandReq, setExpandReq] = useState(false);
  const requestIdToShow =
    selectedRequestId ?? session.traces?.[0]?.request_id ?? null;
  const [expandSpan, setExpandSpan] = useState(false);
  const [collapseAll, setCollapseAll] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  return (
    <>
      <Col className="h-full">
        <Col className="gap-1 items-start sticky top-0 z-[1]">
          {showSpan && (
            <div className="bg-white w-full relative dark:bg-slate-900 border-slate-200 border-t">
              <TraceSpan
                session={session}
                selectedRequestIdDispatch={[
                  selectedRequestId,
                  setSelectedRequestId,
                ]}
                height={expandSpan ? "100%" : "200px"}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 p-2 dark:border-slate-700 dark:hover:bg-slate-700 dark:active:bg-slate-800"
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
        </Col>
        <Row
          className={
            "bg-slate-50 dark:bg-black border-t border-r border-b border-slate-200 dark:border-slate-700 border-collapse overflow-x-auto"
          }
        >
          <div className="flex-shrink-0 w-[30em]">
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
                  data={tracesToTreeNodeData(session.traces)}
                  className="min-h-[1000px] max-h-screen"
                  selectedRequestIdDispatch={[
                    selectedRequestId,
                    setSelectedRequestId,
                  ]}
                  collapseAll={collapseAll}
                  setShowDrawer={setShowDrawer}
                />
              </Col>
            </ScrollArea>
          </div>
          <ScrollArea className="h-full w-fit bg-white">
            <div className="flex flex-col gap-5 w-full">
              <div className="flex-grow [&_.border]:border-none">
                {requestIdToShow &&
                  requests.requests.requests?.find(
                    (r) => r.request_id === requestIdToShow
                  ) && (
                    <>
                      {getNormalizedRequest(
                        requests.requests.requests?.find(
                          (r) => r.request_id === requestIdToShow
                        )!
                      ).render()}
                    </>
                  )}
              </div>
            </div>
          </ScrollArea>
        </Row>
      </Col>
      {showDrawer && requestIdToShow && (
        <RequestDrawerV2
          open={showDrawer}
          setOpen={setShowDrawer}
          request={getNormalizedRequest(
            requests.requests.requests?.find(
              (r) => r.request_id === requestIdToShow
            )!
          )}
          properties={[]}
        />
      )}
    </>
  );
};

export default TreeView;
