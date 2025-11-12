import { useQuery } from "@tanstack/react-query";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { Skeleton } from "@/components/ui/skeleton";
import { Small } from "@/components/ui/typography";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PropertyTopRequestsProps {
  property: string;
  timeFilter: {
    start: Date;
    end: Date;
  };
}

// Chart colors - matching the dashboard bar lists
const BAR_COLORS = [
  "hsl(217, 100%, 55%)", // blue
  "hsl(271, 100%, 60%)", // purple
  "hsl(185, 100%, 40%)", // cyan
  "hsl(145, 80%, 42%)", // green
  "hsl(330, 100%, 55%)", // pink
  "hsl(25, 100%, 50%)", // orange
  "hsl(48, 100%, 50%)", // yellow
  "hsl(160, 100%, 40%)", // teal
  "hsl(280, 100%, 65%)", // violet
  "hsl(10, 100%, 55%)", // red
];

const formatNumber = (num: number) => {
  if (num === 0) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
};

const PropertyTopRequests = ({
  property,
  timeFilter,
}: PropertyTopRequestsProps) => {
  const jawn = useJawnClient();
  const topRequests = useQuery({
    queryKey: ["topRequests", property, timeFilter?.start, timeFilter?.end],
    queryFn: () =>
      jawn.POST("/v1/property/{propertyKey}/top-requests/query", {
        params: {
          path: {
            propertyKey: property,
          },
        },
        body: {
          timeFilter: {
            start: timeFilter.start.toISOString(),
            end: timeFilter.end.toISOString(),
          },
        },
      }),
    enabled: !!property,
  });

  const chartData = topRequests.data?.data?.data || [];
  const displayedData = chartData.filter((item: any) => item.value !== "Other");
  const maxRequests = Math.max(
    ...displayedData.map((item: any) => Number(item.count || 0)),
  );

  if (!property) {
    return null;
  }

  if (topRequests.isLoading) {
    return (
      <div className="h-[240px] space-y-2">
        <Skeleton className="h-8 w-full bg-muted" />
        <Skeleton className="h-8 w-full bg-muted" />
        <Skeleton className="h-8 w-full bg-muted" />
        <Skeleton className="h-8 w-full bg-muted" />
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center">
        <Small className="text-muted-foreground">
          No request data available
        </Small>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-[240px] w-full space-y-2 overflow-y-auto">
        {displayedData.map((item: any, index: number) => {
          const percentage = (Number(item.count) / maxRequests) * 100;
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div className="relative h-8 w-full overflow-hidden rounded">
                  {/* Background bar */}
                  <div
                    className="absolute inset-0"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                      opacity: 0.35,
                    }}
                  />
                  {/* Content on top */}
                  <div className="relative flex h-full items-center justify-between px-3">
                    <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                      {item.value || "Empty"}
                    </span>
                    <span className="ml-3 shrink-0 text-sm font-medium tabular-nums text-slate-700 dark:text-slate-300">
                      {formatNumber(Number(item.count))}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs break-all">{item.value || "Empty"}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default PropertyTopRequests;
