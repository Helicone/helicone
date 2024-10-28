import useNotification from "@/components/shared/notification/useNotification";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hoverCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CopyIcon, InfoIcon } from "lucide-react";
import { getTimeAgo } from "../../../../lib/sql/timeHelpers";
import { formatLargeNumber } from "../../../shared/utils/numberFormat";
import HcBreadcrumb from "../../../ui/hcBreadcrumb";
import SessionFeedback from "../../feedback/sessionFeedback";

function timeDiff(startTime: Date, endTime: Date): string {
  const diff = endTime.getTime() - startTime.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const milliseconds = diff % 1000;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (hours == 0 && minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else if (hours == 0 && minutes == 0 && seconds == 0) {
    return `${milliseconds}ms`;
  } else {
    return `${seconds}.${milliseconds}s`;
  }
}

export const BreadCrumb = ({
  sessionId,
  startTime,
  endTime,
  numTraces,
  sessionCost,
  promptTokens,
  completionTokens,
  models,
  users,
  className,
  sessionFeedback,
}: {
  sessionId: string;
  startTime?: Date;
  endTime?: Date;
  numTraces: number;
  sessionCost: number;
  models: string[];
  promptTokens: number;
  completionTokens: number;
  users: string[];
  className?: string;
  sessionFeedback: boolean | null;
}) => {
  const { setNotification } = useNotification();

  return (
    <div className={cn("flex flex-row items-center space-x-2", className)}>
      <HcBreadcrumb
        pages={[
          {
            href: "/sessions",
            name: "Sessions",
          },
          {
            href: `/sessions/${sessionId}`,
            name: sessionId,
          },
        ]}
      />

      <div className="flex items-center space-x-4">
        <HoverCard>
          <HoverCardTrigger>
            <InfoIcon
              width={16}
              height={16}
              className="text-slate-500 cursor-pointer"
            />
          </HoverCardTrigger>
          <HoverCardContent
            align="start"
            className="w-[220px] p-0 z-[1000] bg-white"
          >
            <div className="p-3 gap-3 flex flex-col border-b border-slate-200">
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold text-slate-700">
                  Session ID
                </h3>
                <div className="flex flex-row items-center gap-2">
                  <p className="text-sm text-slate-500 truncate">{sessionId}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="p-0 w-[14px] h-[14px] text-slate-500"
                    onClick={() => {
                      navigator.clipboard.writeText(sessionId);
                      setNotification("Copied to clipboard", "success");
                    }}
                  >
                    <CopyIcon />
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-3 gap-3 flex flex-col border-b border-slate-200">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-slate-700">Traces</h3>
                <p className="text-sm text-slate-500 truncate">{numTraces}</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-slate-700">
                  Total cost
                </h3>
                <p className="text-sm text-slate-500 truncate">
                  ${formatLargeNumber(sessionCost)}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-slate-700">
                  Total latency
                </h3>
                <p className="text-sm text-slate-500 truncate">
                  {startTime && endTime ? timeDiff(startTime, endTime) : ""}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-slate-700">
                  Models used
                </h3>
                <ScrollArea className="w-[194px]">
                  <div className="flex gap-2">
                    {Array.from(new Set(models)).map((model, idx) => (
                      <Badge
                        key={idx}
                        className="font-normal text-sm text-slate-500 bg-slate-50 border-slate-200 text-nowrap rounded-md"
                        variant="secondary"
                      >
                        {model}
                      </Badge>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </div>

            <div className="p-3 gap-3 flex flex-col border-b border-slate-200">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-slate-700">
                  Total tokens
                </h3>
                <p className="text-sm text-slate-500 truncate">
                  {promptTokens + completionTokens}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-slate-700">
                  Prompt tokens
                </h3>
                <p className="text-sm text-slate-500 truncate">
                  {promptTokens}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-slate-700">
                  Completion tokens
                </h3>
                <p className="text-sm text-slate-500 truncate">
                  {completionTokens}
                </p>
              </div>
            </div>
            <div className="p-3 gap-3 flex flex-col border-b border-slate-200">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-slate-700">
                  Last used
                </h3>
                <p className="text-sm text-slate-500 truncate">
                  {getTimeAgo(endTime)}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-slate-700">
                  Created on
                </h3>
                <p className="text-sm text-slate-500 truncate">
                  {startTime ? startTime.toLocaleDateString() : ""}
                </p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>

        <SessionFeedback sessionId={sessionId} defaultValue={sessionFeedback} />
      </div>
    </div>
  );
};
