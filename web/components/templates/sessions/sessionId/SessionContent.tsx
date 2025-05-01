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
import { useRouter } from "next/router";
import { createContext, useEffect, useMemo, useState } from "react";
import { PiBroadcastBold } from "react-icons/pi";
import { isRealtimeRequest } from "../../../../lib/sessions/realtimeSession";
import { Session, TreeNodeData } from "../../../../lib/sessions/sessionTypes";
import { getTimeIntervalAgo } from "../../../../lib/timeCalculations/time";
import { useGetRequests } from "../../../../services/hooks/requests";
import { useSessions } from "../../../../services/hooks/sessions";
import { Col } from "../../../layout/common/col";
import ExportButton from "../../../shared/themed/table/exportButton";
import FeedbackAction from "../../feedback/thumbsUpThumbsDown";
import TreeView from "./Tree/TreeView";
import { tracesToTreeNodeData } from "@/lib/sessions/helpers";

type ColorMap = Record<string, string>;

interface ColorContextType {
  colors: ColorMap;
}

export const ColorContext = createContext<ColorContextType>({
  colors: {},
});

interface SessionContentProps {
  session: Session;
  session_id: string;
  session_name: string;
  requests: ReturnType<typeof useGetRequests>;
  isLive: boolean;
  setIsLive: (isLive: boolean) => void;
}
export const SessionContent: React.FC<SessionContentProps> = ({
  session,
  session_id,
  session_name,
  requests,
}) => {
  const router = useRouter();
  const [colors, setColors] = useState<ColorMap>({});

  const { _, requestId } = router.query;
  const [selectedRequestId, setSelectedRequestId] = useState<string>(
    (requestId as string) || ""
  );

  // SESSIONS DATA
  const timeFilter = useMemo(
    () => ({
      start: getTimeIntervalAgo("3m"), // Use 3 months like in the page component
      end: new Date(),
    }),
    []
  );
  const { sessions: relatedSessions, isLoading: isLoadingSessions } =
    useSessions({
      timeFilter,
      sessionIdSearch: "", // Add missing required property
      selectedName: session_name === "Unnamed" ? "" : session_name, // Handle Unnamed case
    });

  // HANDLERS
  const handleSessionIdChange = (newSessionId: string) => {
    router.push(`/sessions/${encodeURIComponent(newSessionId)}`);
  };
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

  // SESSION FEEDBACK HACK
  // Check original requests for feedback property
  const requestWithFeedback = useMemo(() => {
    return requests.requests.requests?.find(
      (r) => r.properties["Helicone-Session-Feedback"]
    );
  }, [requests.requests.requests]);
  const sessionFeedbackValue = useMemo(() => {
    const feedback =
      requestWithFeedback?.properties["Helicone-Session-Feedback"];
    if (feedback === "1") return true;
    if (feedback === "0") return false;
    return null;
  }, [requestWithFeedback]);

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
        0
      ),
    [session.traces]
  );
  const completionTokens = useMemo(
    () =>
      session.traces.reduce(
        (acc, trace) =>
          acc +
          (parseInt(`${trace?.request?.heliconeMetadata?.completionTokens}`) ||
            0),
        0
      ),
    [session.traces]
  );
  const totalTokens = useMemo(
    () => promptTokens + completionTokens,
    [promptTokens, completionTokens]
  );
  const avgLatency = useMemo(() => {
    if (!session || session.traces.length === 0) {
      return 0;
    }
    const totalLatency = session.traces.reduce(
      (acc, trace) =>
        acc + (trace.end_unix_timestamp_ms - trace.start_unix_timestamp_ms),
      0
    );
    return totalLatency / session.traces.length;
  }, [session]);
  const sessionStatsToDisplay = useMemo(() => {
    return [
      {
        label: "Start Time",
        value: startTime ? startTime.toLocaleString() : "-",
      },
      { label: "End Time", value: endTime ? endTime.toLocaleString() : "-" },
      {
        label: "Cost",
        value: `$${(session.session_cost_usd ?? 0).toFixed(4)}`,
      },
      { label: "Avg Latency", value: `${avgLatency.toFixed(0)}ms` },
      { label: "Requests", value: session.traces.length.toString() },
      { label: "Tokens", value: totalTokens.toString() },
    ];
  }, [
    startTime,
    endTime,
    session.session_cost_usd,
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
    const treeData = tracesToTreeNodeData(session.traces);
    setColors(getAllPathColors(treeData, {}, null));
  }, [session]);

  return (
    <ColorContext.Provider value={{ colors }}>
      <Col className="h-screen flex flex-col">
        <FoldedHeader
          leftSection={
            <div className="flex flex-row gap-4 items-center">
              {/* Dynamic breadcrumb */}
              <div className="flex flex-row gap-1 items-center">
                <Small className="font-semibold">Sessions</Small>
                <Small className="font-semibold">/</Small>
                <Muted className="text-sm">{session_name}</Muted>
                <Small className="font-semibold">/</Small>

                {isLoadingSessions ? (
                  <Muted className="text-sm">Loading sessions...</Muted>
                ) : (
                  <Select
                    value={session_id}
                    onValueChange={handleSessionIdChange}
                  >
                    <SelectTrigger className="w-[280px] h-8 shadow-sm">
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

              {/* Realtime session reconstruction warning) */}
              {containsRealtime && (
                <div className="flex flex-row gap-2 items-center text-xs text-blue-500 font-semibold">
                  <PiBroadcastBold className="h-4 w-4" />
                  Includes reconstructed realtime requests
                </div>
              )}
            </div>
          }
          rightSection={
            <div className="h-full flex flex-row gap-2 items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* Export the original, raw request data */}
                  <ExportButton rows={requests.requests.requests ?? []} />
                </TooltipTrigger>
                <TooltipContent>Export raw data</TooltipContent>
              </Tooltip>

              <div className="h-4 w-px bg-border" />

              <FeedbackAction
                id={session_id}
                type="session"
                defaultValue={sessionFeedbackValue}
              />
            </div>
          }
          foldContent={
            <div className="h-full flex flex-row items-center divide-x divide-border">
              {sessionStatsToDisplay.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-row gap-1 items-center px-4"
                >
                  <XSmall className="font-medium">{stat.label}</XSmall>
                  <Muted className="text-xs">{stat.value}</Muted>
                </div>
              ))}
            </div>
          }
        />

        <div className="flex-1 overflow-auto">
          {/* TreeView receives the processed session */}
          <TreeView
            selectedRequestId={selectedRequestId}
            setSelectedRequestId={handleRequestIdChange}
            session={session}
            isOriginalRealtime={containsRealtime}
          />
        </div>
      </Col>
    </ColorContext.Provider>
  );
};

function getAllPathColors(
  treeData: TreeNodeData,
  colors: ColorMap,
  parentColor: string | null = null
): ColorMap {
  // Skip if node has no children
  if (!treeData.children?.length) return colors;

  for (const child of treeData.children) {
    if (parentColor === null) {
      // For top-level nodes, generate a unique color
      const randomColor = generateUniqueColor(colors);
      colors[child.currentPath] = randomColor;
      getAllPathColors(child, colors, randomColor);
    } else {
      // For nested nodes, inherit parent's color
      colors[child.currentPath] = parentColor;
      getAllPathColors(child, colors, parentColor);
    }
  }
  return colors;
}

function generateUniqueColor(existingColors: ColorMap): string {
  // Get the count of existing colors to use as an index for deterministic generation
  const colorIndex = Object.keys(existingColors).length;

  const goldenRatioConjugate = 0.618033988749895;

  // Use only colorIndex for deterministic color generation
  let hue = (colorIndex * goldenRatioConjugate) % 1;

  // Keep colors in the light spectrum
  const saturation = 0.7; // 70% saturation for vibrant but not overwhelming colors

  const depthFactor = Math.min(0.3, (colorIndex % 6) * 0.05);
  const lightness = 0.8 - depthFactor; // Keep colors light but with some variation

  // Convert HSL to hex
  let r, g, b;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  r = hue2rgb(p, q, hue + 1 / 3);
  g = hue2rgb(p, q, hue);
  b = hue2rgb(p, q, hue - 1 / 3);

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
