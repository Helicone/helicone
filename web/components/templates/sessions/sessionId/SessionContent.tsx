import { Row } from "@/components/layout/common";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { heliconeRequestToMappedContent } from "@/packages/llm-mapper/utils/getMappedContent";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { PiBroadcastBold } from "react-icons/pi";
import {
  getEffectiveRequests,
  isRealtimeSession,
} from "../../../../lib/sessions/realtimeSession";
import { Session } from "../../../../lib/sessions/sessionTypes";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import { useGetRequests } from "../../../../services/hooks/requests";
import { Col } from "../../../layout/common/col";
import RequestDrawerV2 from "../../requests/requestDrawerV2";
import { BreadCrumb } from "./breadCrumb";
import ChatSession from "./Chat/ChatSession";
import TreeView from "./Tree/TreeView";

interface SessionContentProps {
  session: Session;
  session_id: string;
  requests: ReturnType<typeof useGetRequests>;
  isLive: boolean;
  setIsLive: (isLive: boolean) => void;
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
export const SessionContent: React.FC<SessionContentProps> = ({
  session,
  session_id,
  requests,
  isLive,
  setIsLive,
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

  const requestWithFeedback = useMemo(() => {
    return requests.requests.requests?.find(
      (r) => r.properties["Helicone-Session-Feedback"]
    );
  }, [requests.requests.requests]);

  const [showSpan, setShowSpan] = useLocalStorage("showSpan-TreeView", true);

  // Centralized realtime session handling in a single object
  const realtimeData = useMemo(() => {
    const isRealtime = isRealtimeSession(
      session,
      requests.requests.requests || []
    );

    // Get effective requests (either original or simulated realtime requests)
    const effectiveRequests = isRealtime
      ? getEffectiveRequests(session, requests.requests.requests || [])
      : requests.requests.requests || [];

    // For realtime sessions, get the original request for proper rendering
    let originalRequest = null;
    if (isRealtime && session.traces.length > 0) {
      const originalRequestId = session.traces[0].request_id;
      originalRequest =
        requests.requests.requests?.find(
          (r) => r.request_id === originalRequestId
        ) || null;
    }

    return {
      isRealtime,
      effectiveRequests,
      originalRequest,
    };
  }, [session, requests.requests.requests]);

  if (requests.requests.isLoading) {
    return (
      <div className="h-screen w-full flex justify-center items-center">
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <Col className="h-screen">
      <Tabs
        value={currentTopView}
        onValueChange={(tab) =>
          setCurrentTopView(tab as (typeof TABS)[number]["id"])
        }
        className="flex flex-col h-full"
      >
        {/* Header */}
        <div className="h-16 flex flex-row gap-4 items-center justify-between border-b border-slate-200 dark:border-slate-800 sticky bg-slate-100 dark:bg-slate-900 z-10 p-4">
          <BreadCrumb
            // @ts-ignore
            users={session.traces
              .map((trace) => trace.request.heliconeMetadata.user)
              .filter((user) => user !== "" && user != null)}
            models={session.traces.map((trace) => trace.request.model ?? "")}
            promptTokens={session.traces.reduce(
              (acc, trace) =>
                acc +
                (parseInt(
                  `${trace?.request?.heliconeMetadata?.promptTokens}`
                ) || 0),
              0
            )}
            completionTokens={session.traces.reduce(
              (acc, trace) =>
                acc +
                (parseInt(
                  `${trace?.request?.heliconeMetadata?.completionTokens}`
                ) || 0),
              0
            )}
            sessionId={session_id as string}
            numTraces={session.traces.length}
            sessionCost={session.session_cost_usd}
            startTime={startTime}
            endTime={endTime}
            sessionFeedback={
              requestWithFeedback?.properties["Helicone-Session-Feedback"] ===
              "1"
                ? true
                : requestWithFeedback?.properties[
                    "Helicone-Session-Feedback"
                  ] === "0"
                ? false
                : null
            }
            isLive={isLive}
            setIsLive={setIsLive}
          />
          {realtimeData.isRealtime && (
            <div className="flex flex-row gap-2 items-center text-xs text-blue-500 font-semibold">
              <PiBroadcastBold className="h-4 w-4" />
              Realtime Sessions reconstruct a timeline using connection
              timestamps.
            </div>
          )}
          <Row className="gap-2 items-center">
            {currentTopView === "tree" &&
              (showSpan ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="font-medium flex items-center gap-1"
                  onClick={() => setShowSpan(!showSpan)}
                >
                  <EyeOffIcon width={16} height={16} />
                  Hide Span
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="font-medium flex items-center gap-1"
                  onClick={() => setShowSpan(!showSpan)}
                >
                  <EyeIcon width={16} height={16} />
                  Show Span
                </Button>
              ))}
            <TabsList variant="default">
              {TABS.map((tab) => (
                <TabsTrigger variant="default" key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Row>
        </div>

        <div className="h-full">
          <TabsContent value="tree" className="h-full">
            <TreeView
              selectedRequestId={selectedRequestId}
              setSelectedRequestId={handleRequestIdChange}
              showSpan={showSpan}
              session={session}
              requests={requests}
              realtimeData={realtimeData}
            />
          </TabsContent>

          <TabsContent value="chat" className="h-full">
            <ChatSession
              session={session}
              requests={requests}
              realtimeData={realtimeData}
            />
          </TabsContent>
        </div>

        <RequestDrawerV2
          request={
            requests.requests.requests?.find(
              (r) => r.request_id === selectedRequestId
            ) &&
            heliconeRequestToMappedContent(
              requests.requests.requests?.find(
                (r) => r.request_id === selectedRequestId
              )!
            )
          }
          open={selectedRequestId !== "" && openDrawer}
          setOpen={(open) => handleRequestIdChange("")}
        />
      </Tabs>
    </Col>
  );
};
