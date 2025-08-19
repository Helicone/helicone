import React from "react";

import FoldedHeader from "@/components/shared/FoldedHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Muted, Small, XSmall } from "@/components/ui/typography";
import { tracesToTreeNodeData } from "@/lib/sessions/helpers";
import { useColorMapStore } from "@/store/features/sessions/colorMap";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { PiBroadcastBold } from "react-icons/pi";
import { isRealtimeRequest } from "../../../../lib/sessions/realtimeSession";
import { Session } from "../../../../lib/sessions/sessionTypes";
import { getTimeIntervalAgo } from "../../../../lib/timeCalculations/time";
import { useGetRequests } from "../../../../services/hooks/requests";
import { useSessions } from "../../../../services/hooks/sessions";
import { Col } from "../../../layout/common/col";
import ExportButton from "../../../shared/themed/table/exportButton";
import TreeView from "./Tree/TreeView";
import TableFooter from "../../requests/tableFooter";

import { TagType } from "@/packages/common/sessions/tags";
import Link from "next/link";
import { SessionTag } from "../../feedback/sessionTag";
import { FilterASTButton } from "@/filterAST/FilterASTButton";
import { get24HourFromDate } from "@/components/shared/utils/utils";

export const EMPTY_SESSION_NAME = "__unnamed_helicone_session__";

interface SessionContentProps {
  session: Session;
  session_id: string;
  session_name: string;
  requests: ReturnType<typeof useGetRequests>;
  isLive: boolean;
  setIsLive: (_isLive: boolean) => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (_newPage: number) => void;
  onPageSizeChange: (_newPageSize: number) => void;
}

export const SessionContent: React.FC<SessionContentProps> = ({
  session,
  session_id,
  session_name,
  requests,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const router = useRouter();
  const { initializeColorMap } = useColorMapStore();

  const { requestId } = router.query;
  const [selectedRequestId, setSelectedRequestId] = useState<string>(
    (requestId as string) || "",
  );

  // SESSIONS DATA
  const timeFilter = useMemo(
    () => ({
      start: getTimeIntervalAgo("3m"), // Use 3 months like in the page component
      end: new Date(),
    }),
    [],
  );

  const { sessions: relatedSessions, isLoading: isLoadingSessions } =
    useSessions({
      timeFilter,
      sessionIdSearch: "",
      selectedName: session_name === EMPTY_SESSION_NAME ? "" : session_name,
    });

  // HANDLERS
  const handleSessionIdChange = (newSessionId: string) => {
    router.push(
      `/sessions/${session_name}/${encodeURIComponent(newSessionId)}`,
    );
  };
  const handleRequestIdChange = (newRequestId: string) => {
    setSelectedRequestId(newRequestId);
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, requestId: newRequestId },
      },
      undefined,
      { shallow: true },
    );
  };

  // AGREGATED SESSION STATS (Derived from the processed session object)
  const startTime = useMemo(() => {
    return session.start_time_unix_timestamp_ms
      ? new Date(session.start_time_unix_timestamp_ms)
      : undefined;
  }, [session.start_time_unix_timestamp_ms]);
  const endTime = useMemo(() => {
    return session.end_time_unix_timestamp_ms
      ? new Date(session.end_time_unix_timestamp_ms)
      : undefined;
  }, [session.end_time_unix_timestamp_ms]);
  const promptTokens = useMemo(
    () =>
      session.traces.reduce(
        (acc, trace) =>
          acc +
          (parseInt(`${trace?.request?.heliconeMetadata?.promptTokens}`) || 0),
        0,
      ),
    [session.traces],
  );
  const completionTokens = useMemo(
    () =>
      session.traces.reduce(
        (acc, trace) =>
          acc +
          (parseInt(`${trace?.request?.heliconeMetadata?.completionTokens}`) ||
            0),
        0,
      ),
    [session.traces],
  );
  const totalTokens = useMemo(
    () => promptTokens + completionTokens,
    [promptTokens, completionTokens],
  );
  const avgLatency = useMemo(() => {
    if (!session || session.traces.length === 0) {
      return 0;
    }
    const totalLatency = session.traces.reduce(
      (acc, trace) =>
        acc + (trace.end_unix_timestamp_ms - trace.start_unix_timestamp_ms),
      0,
    );
    return totalLatency / session.traces.length;
  }, [session]);
  const sessionStatsToDisplay = useMemo(() => {
    return [
      {
        label: "Start Time",
        value: startTime ? get24HourFromDate(startTime) : "-",
      },
      { label: "End Time", value: endTime ? get24HourFromDate(endTime) : "-" },
      {
        label: "Cost",
        value: `$${(session.session_cost ?? 0).toFixed(4)}`,
      },
      { label: "Avg Latency", value: `${avgLatency.toFixed(0)}ms` },
      { label: "Requests", value: session.traces.length.toString() },
      { label: "Tokens", value: totalTokens.toString() },
    ];
  }, [
    startTime,
    endTime,
    session.session_cost,
    avgLatency,
    session.traces.length,
    totalTokens,
  ]);

  // Check if the session contains a realtime request
  const containsRealtime = useMemo(() => {
    const rawRequests = requests.requests.requests ?? [];
    return rawRequests.some(isRealtimeRequest);
  }, [requests.requests.requests]);

  useEffect(() => {
    const traceData = tracesToTreeNodeData(session.traces);
    initializeColorMap(traceData);
  }, [session.traces, initializeColorMap]);

  return (
    <Col className="flex h-screen flex-col">
      <FoldedHeader
        leftSection={
          <div className="flex flex-row items-center gap-4">
            {/* Dynamic breadcrumb */}
            <div className="flex flex-row items-center gap-1">
              <Link href="/sessions" className="no-underline">
                <Small className="font-semibold">Sessions</Small>
              </Link>
              <Small className="font-semibold">/</Small>
              <Link
                href={
                  session_name === EMPTY_SESSION_NAME
                    ? "/sessions"
                    : `/sessions?name=${encodeURIComponent(session_name)}`
                }
                className="no-underline"
              >
                <Muted className="text-sm">{session_name}</Muted>
              </Link>
              <Small className="font-semibold">/</Small>

              {isLoadingSessions ? (
                <Muted className="text-sm">Loading sessions...</Muted>
              ) : (
                <Select
                  value={session_id}
                  onValueChange={handleSessionIdChange}
                >
                  <SelectTrigger className="h-8 w-[280px] shadow-sm">
                    <SelectValue placeholder="Select Session ID" />
                  </SelectTrigger>
                  <SelectContent>
                    {relatedSessions?.map((s) => (
                      <SelectItem key={s.session_id} value={s.session_id}>
                        {s.session_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <FilterASTButton />

            {/* Realtime session reconstruction warning) */}
            {containsRealtime && (
              <div className="flex flex-row items-center gap-2 text-xs font-semibold text-blue-500">
                <PiBroadcastBold className="h-4 w-4" />
                Includes reconstructed realtime requests
              </div>
            )}
          </div>
        }
        rightSection={
          <div className="flex h-full flex-row items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                {/* Export the original, raw request data */}
                <ExportButton rows={requests.requests.requests ?? []} />
              </TooltipTrigger>
              <TooltipContent>Export raw data</TooltipContent>
            </Tooltip>

            <div className="h-4 w-px bg-border" />

            <SessionTag id={session_id} type={TagType.SESSION} />
          </div>
        }
        foldContent={
          <div className="flex h-full flex-row items-center divide-x divide-border">
            {sessionStatsToDisplay.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-row items-center gap-1 px-4"
              >
                <XSmall className="font-medium">{stat.label}</XSmall>
                <Muted className="text-xs">{stat.value}</Muted>
              </div>
            ))}
          </div>
        }
      />

      <div className="flex-1 overflow-auto">
        <TreeView
          selectedRequestId={selectedRequestId}
          setSelectedRequestId={handleRequestIdChange}
          session={session}
          isOriginalRealtime={containsRealtime}
        />
      </div>

      <TableFooter
        currentPage={currentPage}
        pageSize={pageSize}
        isCountLoading={requests.count.isLoading}
        count={requests.count.data?.data || 0}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[100, 250, 500, 1000]}
      />
    </Col>
  );
};
