import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DatabaseIcon, MessageSquareIcon, SlidersIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { HeliconeRequest } from "../../../../../lib/api/request/request";
import { Row } from "../../../../layout/common/row";
import { clsx } from "../../../../shared/clsx";

const bgColor = {
  LLM: "bg-sky-200 dark:bg-sky-900 text-sky-700 dark:text-sky-200 ",
  tool: "bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-200 ",
  vector_db:
    "bg-orange-200 dark:bg-orange-900 text-orange-700 dark:text-orange-200 ",
  user: "bg-blue-500 dark:bg-blue-700 text-blue-700 text-slate-200 dark:text-white",
  assistant:
    "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 ",
};

export function RequestNode({
  requestId,
  path,
  selectedRequestIdDispatch,
  className = "",
  realtimeData,
}: {
  requestId: string;
  path?: string;
  selectedRequestIdDispatch: [string, (x: string) => void];
  className?: string;
  onBoardingRequestTrace?: any;
  isRequestSingleChild?: boolean;
  realtimeData?: {
    isRealtime: boolean;
    effectiveRequests: HeliconeRequest[];
    originalRequest: HeliconeRequest | null;
  };
}) {
  const [selectedRequestId, setSelectedRequestId] = selectedRequestIdDispatch;
  const modelRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  // Use realtimeData if available, otherwise fall back to isRealtime prop
  const isRealtimeSession = realtimeData?.isRealtime || false;

  // For regular requests, use the model name
  // For realtime sessions, use the role (user/assistant) to style the request
  const isRealtimeUser = isRealtimeSession && path?.includes("user");
  const isRealtimeAssistant = isRealtimeSession && path?.includes("assistant");
  let type = "LLM";

  if (isRealtimeUser) {
    type = "user";
  } else if (isRealtimeAssistant) {
    type = "assistant";
  } else if (path?.includes("tool")) {
    type = "tool";
  } else if (path?.includes("vector_db")) {
    type = "vector_db";
  }

  // Get additional request info for realtime sessions
  const requestInfo = useMemo(() => {
    if (!isRealtimeSession || !realtimeData?.effectiveRequests) {
      return null;
    }

    const request = realtimeData.effectiveRequests.find(
      (req) => req.request_id === requestId
    );

    if (!request) return null;

    const timestamp = request.properties?._helicone_realtime_timestamp
      ? new Date(
          request.properties._helicone_realtime_timestamp
        ).toLocaleTimeString()
      : new Date(request.request_created_at).toLocaleTimeString();

    return {
      timestamp,
      role: request.properties?._helicone_realtime_role || type,
      // If we can parse the message content, we could show a snippet here in the future
    };
  }, [isRealtimeSession, realtimeData, requestId, type]);

  const icon = useMemo(() => {
    switch (type) {
      case "user":
      case "assistant":
        return <MessageSquareIcon size={14} />;
      case "tool":
        return <SlidersIcon size={14} />;
      case "vector_db":
        return <DatabaseIcon size={14} />;
      default:
        return null;
    }
  }, [type]);

  useEffect(() => {
    const el = modelRef.current;
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, [path]);

  return (
    <div
      className={clsx(
        "flex flex-col dark:bg-slate-900 py-[8px] pl-4 px-4 cursor-pointer w-full",
        selectedRequestId === requestId
          ? "bg-sky-100 dark:bg-slate-900 hover:bg-sky-100 dark:hover:bg-slate-800"
          : "bg-white dark:bg-slate-950 hover:bg-sky-50 dark:hover:bg-slate-800",
        className
      )}
      onClick={() => setSelectedRequestId(requestId)}
    >
      <Row className="w-full gap-2 items-center">
        <Row className="items-center gap-2 flex-grow min-w-0">
          <div
            className={clsx(
              "flex-shrink-0 px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap flex items-center gap-1",
              bgColor[type as keyof typeof bgColor]
            )}
          >
            {icon} {type}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  ref={modelRef}
                  className="flex-grow flex-shrink-1 max-w-[200px] min-w-[100px] bg-transparent dark:bg-transparent dark:border-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 text-xs font-medium rounded-md truncate"
                >
                  {/* For realtime messages, improve the display */}
                  {isRealtimeSession && requestInfo ? (
                    <span>
                      {requestInfo.timestamp} • {path?.split("/").pop() || path}
                    </span>
                  ) : (
                    <span>{path?.split("/").pop() || path}</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span>{path}</span>
                {isRealtimeSession && requestInfo && (
                  <div className="mt-1 text-xs text-gray-500">
                    Message sent at {requestInfo.timestamp}
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Row>
      </Row>
    </div>
  );
}
