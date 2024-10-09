import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { Session } from "../../../../lib/sessions/sessionTypes";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import { useGetRequests } from "../../../../services/hooks/requests";
import { Col } from "../../../layout/common/col";
import getNormalizedRequest from "../../requestsV2/builder/requestBuilder";
import RequestDrawerV2 from "../../requestsV2/requestDrawerV2";
import { BreadCrumbV2 } from "./breadCrumbV2";
import ChatSession from "./Chat/ChatSession";
import TreeView from "./Tree/TreeView";
import { Row } from "@/components/layout/common";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon } from "lucide-react";

interface SessionContentV2Props {
  session: Session;
  session_id: string;
  requests: ReturnType<typeof useGetRequests>;
}

export const TABS = [
  {
    id: "tree",
    label: "Tree",
  },
  {
    id: "chat",
    label: "Chat",
  },
] as const;

const SessionContentV2: React.FC<SessionContentV2Props> = ({
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

  const [openDrawer, setOpenDrawer] = useState(false);

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

  const [showSpan, setShowSpan] = useLocalStorage("showSpan-TreeView", true);

  return (
    <Col className="gap-[12px]">
      <Tabs
        value={currentTopView}
        onValueChange={(tab) =>
          setCurrentTopView(tab as (typeof TABS)[number]["id"])
        }
      >
        <Row className="items-center justify-between">
          <BreadCrumbV2
            className="mx-8 pt-10"
            // @ts-ignore
            users={session.traces
              .map((trace) => trace.request.user)
              .filter((user) => user !== "" && user != null)}
            models={session.traces.map((trace) => trace.request.model ?? "")}
            promptTokens={session.traces.reduce(
              (acc, trace) =>
                acc + (parseInt(`${trace?.request?.promptTokens}`) || 0),
              0
            )}
            completionTokens={session.traces.reduce(
              (acc, trace) =>
                acc + (parseInt(`${trace?.request?.completionTokens}`) || 0),
              0
            )}
            sessionId={session_id as string}
            numTraces={session.traces.length}
            sessionCost={session.session_cost_usd}
            startTime={startTime}
            endTime={endTime}
          />

          <Row className="gap-2 items-center">
            <TabsList variant="secondary" className="h-[30px]">
              {TABS.map((tab) => (
                <TabsTrigger
                  className="h-[22px] text-slate-900 text-xs"
                  variant="secondary"
                  key={tab.id}
                  value={tab.id}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {currentTopView === "tree" &&
              (showSpan ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-[30px] text-sm font-medium text-slate-900 flex items-center gap-1"
                  onClick={() => setShowSpan(!showSpan)}
                >
                  <EyeOffIcon width={16} height={16} />
                  Hide span
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-[30px] text-sm font-medium text-slate-900 flex items-center gap-1"
                  onClick={() => setShowSpan(!showSpan)}
                >
                  <EyeIcon width={16} height={16} />
                  Show span
                </Button>
              ))}
          </Row>
        </Row>

        <TabsContent value="tree">
          <TreeView
            session={session}
            selectedRequestId={selectedRequestId}
            setSelectedRequestId={handleRequestIdChange}
            requests={requests}
            showSpan={showSpan}
          />
        </TabsContent>

        <TabsContent value="chat">
          <ChatSession requests={requests} />
        </TabsContent>
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
          open={selectedRequestId !== "" && openDrawer}
          setOpen={(open) => handleRequestIdChange("")}
          properties={[]}
        />
      </Tabs>
    </Col>
  );
};

export default SessionContentV2;
