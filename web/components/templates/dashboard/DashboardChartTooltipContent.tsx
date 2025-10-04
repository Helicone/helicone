import { CustomTooltipProps } from "@tremor/react";
import { cn } from "@/lib/utils";
import React from "react";

const DashboardChartTooltipContent = (props: CustomTooltipProps) => {
  return (
    <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-slate-200 border-slate-200/50 bg-white px-2.5 py-1.5 text-xs shadow-xl dark:border-slate-800 dark:border-slate-800/50 dark:bg-slate-950">
      <p className="text-sm text-slate-950 dark:text-slate-50">
        {props.label?.toLocaleString()}
      </p>
      <div className="grid gap-1.5">
        {props.payload?.map((item) => {
          return (
            <div
              key={item.dataKey}
              className={cn(
                "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-slate-500 dark:[&>svg]:text-slate-400",
                "dot",
              )}
            >
              <div
                className={cn(
                  "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                  "h-2.5 w-2.5",
                )}
                style={
                  {
                    "--color-bg": item.color,
                    "--color-border": item.color,
                  } as React.CSSProperties
                }
              />
              <div className="flex flex-1 justify-between gap-2 leading-none">
                <div className="grid gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400">
                    {item.name}
                  </span>
                </div>
                <span className="font-mono font-medium tabular-nums text-slate-950 dark:text-slate-50">
                  {item.value?.toLocaleString() ?? item.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardChartTooltipContent;
