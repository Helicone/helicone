import {
  ArrowTurnDownRightIcon,
  Bars3BottomRightIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { Session } from "../../../../lib/sessions/sessionTypes";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import { useGetRequests } from "../../../../services/hooks/requests";
import { Col } from "../../../layout/common/col";
import ThemedTabSelector from "../../../shared/themed/themedTabSelector";
import getNormalizedRequest from "../../requestsV2/builder/requestBuilder";
import RequestDrawerV2 from "../../requestsV2/requestDrawerV2";
import { BreadCrumb } from "./breadCrumb";
import ChatSession from "./Chat/ChatSession";
import { TraceSpan } from "./Span";
import TreeView from "./Tree/TreeView";

interface SessionContentProps {
  session: Session;
  session_id: string;
  requests: ReturnType<typeof useGetRequests>;
}

const TABS = [
  {
    id: "span",
    label: "Span",
    icon: <Bars3BottomRightIcon className="size-5" />,
  },
  {
    id: "tree",
    label: "Tree",
    icon: <ArrowTurnDownRightIcon className="size-5" />,
  },
  {
    id: "chat",
    label: "Chat",
    icon: <ChatBubbleLeftIcon className="size-5" />,
  },
] as const;

const SessionContent: React.FC<SessionContentProps> = ({
  session,
  session_id,
  requests,
}) => {
  const router = useRouter();
  const { view, requestId } = router.query;

  const [selectedRequestId, setSelectedRequestId] = useState<string>(
    (requestId as string) || ""
  );

  const handleRequestIdChange = (newRequestId: string) => {
    setSelectedRequestId(newRequestId);
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, requestId: newRequestId },
      },
      undefined,
      { shallow: true }
    );
  };

  const [currentTopView, setCurrentTopView] = useLocalStorage(
    "currentTopView",
    (view as (typeof TABS)[number]["id"]) ?? "tree"
  );

  const startTime = useMemo(() => {
    const dates =
      requests.requests.requests?.map((r) => new Date(r.request_created_at)) ??
      [];

    return dates.sort((a, b) => a.getTime() - b.getTime())?.[0] ?? undefined;
  }, [requests.requests.requests]);

  const endTime = useMemo(() => {
    const dates =
      requests.requests.requests?.map((r) => new Date(r.request_created_at)) ??
      [];

    return dates.sort((a, b) => b.getTime() - a.getTime())?.[0] ?? undefined;
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
      <ThemedTabSelector
        tabs={TABS as any}
        currentTab={currentTopView}
        onTabChange={(tabId) =>
          setCurrentTopView(tabId as (typeof TABS)[number]["id"])
        }
      />

      {currentTopView === "span" && (
        <div className="bg-white p-4">
          <TraceSpan
            session={session}
            selectedRequestIdDispatch={[
              selectedRequestId,
              handleRequestIdChange,
            ]}
          />
        </div>
      )}

      {currentTopView === "tree" && (
        <TreeView
          session={session}
          selectedRequestId={selectedRequestId}
          setSelectedRequestId={handleRequestIdChange}
          requests={requests}
          showSpan={false}
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
        setOpen={(open) => handleRequestIdChange("")}
        properties={[]}
      />
    </Col>
  );
};

export default SessionContent;
