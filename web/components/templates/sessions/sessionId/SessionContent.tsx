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
        sessionId={session_id as string}
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
        </Row>
      )}

      {currentTopView === "chat" && <ChatSession requests={requests} />}
    </Col>
  );
};

export default SessionContent;
