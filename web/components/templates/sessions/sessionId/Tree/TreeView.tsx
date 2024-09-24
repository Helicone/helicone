import { useState } from "react";
import { tracesToTreeNodeData } from "../../../../../lib/sessions/helpers";
import { Session } from "../../../../../lib/sessions/sessionTypes";
import { Row } from "../../../../layout/common/row";
import getNormalizedRequest from "../../../requestsV2/builder/requestBuilder";
import { TraceSpan } from "../Span";
import { Tree } from "./Tree";
import RequestRow from "../../../requestsV2/requestRow";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useGetRequests } from "../../../../../services/hooks/requests";
import { Col } from "../../../../layout/common";
import { useLocalStorage } from "../../../../../services/hooks/localStorage";

interface TreeViewProps {
  session: Session;
  selectedRequestId: string;
  setSelectedRequestId: (id: string) => void;
  requests: ReturnType<typeof useGetRequests>;
}

const TreeView: React.FC<TreeViewProps> = ({
  session,
  selectedRequestId,
  setSelectedRequestId,
  requests,
}) => {
  const [expandReq, setExpandReq] = useState(false);
  const requestIdToShow =
    selectedRequestId ?? session.traces?.[0]?.request_id ?? null;

  const [showSpan, setShowSpan] = useLocalStorage("showSpan-TreeView", true);

  return (
    <Col className="gap-5 ">
      <Col className="gap-1 items-start">
        {showSpan && (
          <div className="bg-white rounded-lg w-full">
            <TraceSpan
              session={session}
              selectedRequestIdDispatch={[
                selectedRequestId,
                setSelectedRequestId,
              ]}
              height="200px"
            />
          </div>
        )}
        <button
          onClick={() => setShowSpan(!showSpan)}
          className="text-xs font-thin"
        >
          {showSpan ? "Hide Span" : "Show Span"}
        </button>
      </Col>
      <Row className={"gap-[12px]"}>
        <Tree
          data={tracesToTreeNodeData(session.traces)}
          className="pr-10 min-h-[1000px] w-[30em] min-w-[30em] rounded-lg max-h-screen overflow-auto"
          selectedRequestIdDispatch={[selectedRequestId, setSelectedRequestId]}
        />
        <div className="flex flex-col gap-5">
          {requestIdToShow && (
            <div>
              <div
                className={
                  expandReq
                    ? "bg-white p-5 rounded-lg flex-shrink border border-gray-300"
                    : "hidden"
                }
              >
                <button
                  className="flex flex-row gap-1 items-center ml-0 pl-0 mb-3"
                  type="button"
                  onClick={() => setExpandReq(false)}
                >
                  <ChevronDownIcon className="h-6 w-6 m-0 p-0" />
                  <span className="text-sm font-semibold">Hide Details</span>
                </button>
                {session.traces.filter(
                  (trace) => trace.request_id == selectedRequestId
                )?.[0]?.request && (
                  <RequestRow
                    displayPreview={false}
                    wFull={false}
                    request={
                      session.traces.filter(
                        (trace) => trace.request_id == selectedRequestId
                      )?.[0]?.request
                    }
                    properties={[]}
                    open={true}
                  />
                )}
              </div>

              <div
                className={
                  expandReq
                    ? "hidden"
                    : "bg-white p-5 rounded-lg flex-shrink border border-gray-300"
                }
              >
                <button
                  className="flex flex-row gap-1 items-center"
                  type="button"
                  onClick={() => setExpandReq(true)}
                >
                  <ChevronDownIcon className="h-6 w-6" />
                  <span className="text-sm font-semibold">Expand Details</span>
                </button>
              </div>
            </div>
          )}

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
    </Col>
  );
};

export default TreeView;
