import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { Session } from "../../../../lib/sessions/sessionTypes";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import { useGetRequests } from "../../../../services/hooks/requests";
import { Col } from "../../../layout/common/col";
import getNormalizedRequest from "../../requestsV2/builder/requestBuilder";
import RequestDrawerV2 from "../../requestsV2/requestDrawerV2";
import { BreadCrumb } from "./breadCrumb";
import ChatSession from "./Chat/ChatSession";
import { TraceSpan } from "./Span";
import TabSelector from "./TabSelector";
import TreeView from "./Tree/TreeView";

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

  const router = useRouter();

  const { view } = router.query;

  const [currentTopView, setCurrentTopView] = useLocalStorage(
    "currentTopView",
    (view as (typeof TABS)[number]) ?? "tree"
  );

  const startTime = useMemo(() => {
    const dates =
      requests.requests.requests?.map((r) => new Date(r.request_created_at)) ??
      [];

    return dates.sort((a, b) => a.getTime() - b.getTime())?.[0] ?? new Date(0);
  }, [requests.requests.requests]);

  const endTime = useMemo(() => {
    const dates =
      requests.requests.requests?.map((r) => new Date(r.request_created_at)) ??
      [];

    return dates.sort((a, b) => b.getTime() - a.getTime())?.[0] ?? new Date(0);
  }, [requests.requests.requests]);

  return (
    <Col className="gap-[12px]">
      <BreadCrumb
        // @ts-ignore
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
        startTime={startTime}
        endTime={endTime}
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
        <TreeView
          session={session}
          selectedRequestId={selectedRequestId}
          setSelectedRequestId={setSelectedRequestId}
          requests={requests}
        />
      )}

      {currentTopView === "chat" && <ChatSession requests={requests} />}
      <RequestDrawerV2
        request={
          requests.requests.requests?.find(
            (r) => r.request_id === selectedRequestId
          ) &&
          getNormalizedRequest(
            requests.requests.requests?.find(
              (r) => r.request_id === selectedRequestId
            )!
          )
        }
        open={selectedRequestId !== "" && currentTopView === "span"}
        setOpen={(open) => setSelectedRequestId("")}
        properties={[]}
      />
    </Col>
  );
};

export default SessionContent;
