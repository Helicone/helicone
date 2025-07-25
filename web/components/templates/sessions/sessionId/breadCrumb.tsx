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
import clsx from "clsx";
import { CopyIcon, InfoIcon } from "lucide-react";
import { getTimeAgo } from "../../../../lib/sql/timeHelpers";
import { formatLargeNumber } from "../../../shared/utils/numberFormat";
import HcBreadcrumb from "../../../ui/hcBreadcrumb";

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
  isLive,
  setIsLive,
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
  isLive: boolean;
  setIsLive: (isLive: boolean) => void;
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
            href: `/sessions/${encodeURIComponent(sessionId)}`,
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
              className="cursor-pointer text-slate-500"
            />
          </HoverCardTrigger>
          <HoverCardContent
            align="start"
            className="z-[1000] w-[220px] bg-white p-0"
          >
            <div className="flex flex-col gap-3 border-b border-slate-200 p-3">
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold text-slate-700">
                  Session ID
                </h3>
                <div className="flex flex-row items-center gap-2">
                  <p className="truncate text-sm text-slate-500">{sessionId}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-[14px] w-[14px] p-0 text-slate-500"
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
            <div className="flex flex-col gap-3 border-b border-slate-200 p-3">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-slate-700">Traces</h3>
                <p className="truncate text-sm text-slate-500">{numTraces}</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-slate-700">
                  Total cost
                </h3>
                <p className="truncate text-sm text-slate-500">
                  ${formatLargeNumber(sessionCost)}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-slate-700">
                  Total latency
                </h3>
                <p className="truncate text-sm text-slate-500">
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
                        className="text-nowrap rounded-md border-slate-200 bg-slate-50 text-sm font-normal text-slate-500"
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

            <div className="flex flex-col gap-3 border-b border-slate-200 p-3">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-slate-700">
                  Total tokens
                </h3>
                <p className="truncate text-sm text-slate-500">
                  {promptTokens + completionTokens}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-slate-700">
                  Prompt tokens
                </h3>
                <p className="truncate text-sm text-slate-500">
                  {promptTokens}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-slate-700">
                  Completion tokens
                </h3>
                <p className="truncate text-sm text-slate-500">
                  {completionTokens}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 border-b border-slate-200 p-3">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-slate-700">
                  Last used
                </h3>
                <p className="truncate text-sm text-slate-500">
                  {getTimeAgo(endTime)}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-slate-700">
                  Created on
                </h3>
                <p className="truncate text-sm text-slate-500">
                  {startTime ? startTime.toLocaleDateString() : ""}
                </p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>

        <Button
          variant="ghost"
          className={clsx(
            "flex flex-row items-center gap-2",
            isLive ? "animate-pulse text-green-500" : "text-slate-500",
          )}
          size="sm_sleek"
          onClick={() => setIsLive(!isLive)}
        >
          <div
            className={clsx(
              isLive ? "bg-green-500" : "bg-slate-500",
              "h-2 w-2 rounded-full",
            )}
          ></div>
          <span className="whitespace-nowrap text-xs font-medium italic text-slate-900 dark:text-slate-100">
            {isLive ? "Live" : "Start Live"}
          </span>
        </Button>
      </div>
    </div>
  );
};
