import { Card } from "@/components/ui/card";
import React from "react";

export interface MetricsPanelProps {
  metric: {
    id: string;
    isLoading: boolean;
    value: number | string;
    label: string;
    labelUnits?: string;
    icon?: React.ForwardRefExoticComponent<
      React.SVGProps<SVGSVGElement> & {
        title?: string | undefined;
        titleId?: string | undefined;
      }
    >;
    onInformationHref?: string;
  };
}

export function MetricsPanel(props: MetricsPanelProps) {
  const { metric } = props;

  return (
    <Card className="flex h-full flex-col">
      <dd className="flex flex-grow flex-col p-4 text-slate-900 dark:text-slate-50">
        <div className="flex w-full items-center justify-between">
          <div className="text-[13px] text-slate-500">{metric.label}</div>
          {metric.icon && <metric.icon className="h-6 w-6 text-slate-500" />}
        </div>
        {metric.isLoading ? (
          <div className="mt-1 h-6 w-16 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
        ) : (
          <div className="mt-auto text-xl font-semibold text-slate-900 dark:text-slate-50">
            {metric.value} {metric.labelUnits}
          </div>
        )}
      </dd>
    </Card>
  );
}
