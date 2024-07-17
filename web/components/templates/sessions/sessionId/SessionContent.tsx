import { useRouter } from "next/router";
import { useState } from "react";
import { tracesToTreeNodeData } from "../../../../lib/sessions/helpers";
import { Session } from "../../../../lib/sessions/sessionTypes";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import { useGetRequests } from "../../../../services/hooks/requests";
import { Col } from "../../../layout/common/col";
import { Row } from "../../../layout/common/row";
import getNormalizedRequest from "../../requestsV2/builder/requestBuilder";
import { TraceSpan } from "./Span";
import { Tree } from "./Tree/Tree";
import { BreadCrumb } from "./breadCrumb";
import TabSelector from "./TabSelector";
import ChatSession from "./Chat/ChatSession";
import RequestRow from "../../requestsV2/requestRow";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

interface SessionContentProps {
  session: Session;
  session_id: string;
  requests: ReturnType<typeof useGetRequests>;
}

const TABS = ["span", "tree", "chat"] as const;

const SessionContent: React.FC<SessionContentProps> = ({
  session,
  session_id,
  requests,
}) => {
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const [expandReq, setExpandReq] = useState(false);
  const requestIdToShow =
    selectedRequestId ?? session.traces?.[0]?.request_id ?? null;

  const router = useRouter();

  const { view } = router.query;

  const [currentTopView, setCurrentTopView] = useLocalStorage(
    "currentTopView",
    (view as (typeof TABS)[number]) ?? "tree"
  );

  return (
    <Col className="gap-[12px]">
      <BreadCrumb
        users={session.traces
          .map((trace) => trace.request.user)
          .filter((user) => user !== "" && user != null)}
        models={session.traces.map((trace) => trace.request.model ?? "")}
        promptTokens={session.traces.reduce(
          (acc, trace) => acc + (trace?.request?.promptTokens || 0),
          0
        )}
        completionTokens={session.traces.reduce(
          (acc, trace) => acc + (trace?.request?.promptTokens || 0),
          0
        )}
        sessionId={session_id as string}
        numTraces={session.traces.length}
        sessionCost={session.session_cost_usd}
        startTime={
          requests.requests.data?.data
            ? new Date(
                requests.requests.data?.data?.[
                  (requests.requests.data?.data?.length ?? 0) - 1
                ]?.request_created_at
              )
            : new Date(0)
        }
        endTime={
          requests.requests.data?.data
            ? new Date(
                requests.requests.data?.data?.[0]?.request_created_at ?? 0
              )
            : new Date(0)
        }
      />
      <TabSelector
        tabs={TABS}
        currentTopView={currentTopView}
        setCurrentTopView={setCurrentTopView}
      />

      {currentTopView === "span" && (
        <div className="bg-white p-4">
          <TraceSpan
            session={session}
            selectedRequestIdDispatch={[
              selectedRequestId,
              setSelectedRequestId,
            ]}
          />
        </div>
      )}

      {currentTopView === "tree" && (
        <Row className={"gap-[12px]"}>
          <Tree
            data={tracesToTreeNodeData(session.traces)}
            className="pr-10 min-h-[1000px] w-[30em] min-w-[30em] rounded-lg max-h-screen overflow-auto"
            selectedRequestIdDispatch={[
              selectedRequestId,
              setSelectedRequestId,
            ]}
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
                  <RequestRow
                    displayPreview={false}
                    wFull={false}
                    request={
                      session.traces.filter(
                        (trace) => trace.request_id == selectedRequestId
                      )[0].request
                    }
                    properties={[]}
                    open={true}
                  />
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
                    <span className="text-sm font-semibold">
                      Expand Details
                    </span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex-grow">
              {requestIdToShow &&
                requests.requests.data?.data?.find(
                  (r) => r.request_id === requestIdToShow
                ) &&
                getNormalizedRequest(
                  requests.requests.data?.data?.find(
                    (r) => r.request_id === requestIdToShow
                  )!
                ).render()}
            </div>
          </div>
        </Row>
      )}

      {currentTopView === "chat" && <ChatSession requests={requests} />}
    </Col>
  );
};

export default SessionContent;
