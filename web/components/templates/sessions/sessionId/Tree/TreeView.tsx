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
    <Col className="gap-5 ">
      <Col className="gap-1 items-start">
        {showSpan && (
          <div className="bg-white rounded-lg w-full relative">
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
              className="absolute top-3 right-3 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 p-2"
              onClick={() => setExpandSpan(!expandSpan)}
            >
              {expandSpan ? (
                <ShrinkIcon width={16} height={16} className="text-slate-900" />
              ) : (
                <ExpandIcon width={16} height={16} className="text-slate-900" />
              )}
            </Button>
          </div>
        )}
      </Col>
      <Row
        className={
          "bg-slate-50 border border-slate-200 border-collapse overflow-x-auto"
        }
      >
        <Col className="border-r border-slate-200">
          <div className="w-full bg-slate-50 flex justify-end h-10">
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
            className="min-h-[1000px] w-[30em] min-w-[30em] max-h-screen"
            selectedRequestIdDispatch={[
              selectedRequestId,
              setSelectedRequestId,
            ]}
            collapseAll={collapseAll}
            setShowDrawer={setShowDrawer}
          />
        </Col>
        <div className="flex flex-col gap-5 w-full">
          <div className="flex-grow">
            {requestIdToShow &&
              requests.requests.requests?.find(
                (r) => r.request_id === requestIdToShow
              ) &&
              getNormalizedRequest(
                requests.requests.requests?.find(
                  (r) => r.request_id === requestIdToShow
                )!
              ).render()}
          </div>
        </div>
      </Row>
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
    </Col>
  );
};

export default TreeView;
