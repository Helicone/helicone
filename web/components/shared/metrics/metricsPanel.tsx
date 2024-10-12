import { Card } from "@tremor/react";

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
    <Card className="border border-slate-200 bg-white text-slate-950 !shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 rounded-lg h-full flex flex-col ring-0">
      <dd className="text-slate-900 dark:text-slate-50 flex flex-col flex-grow">
        <div className="flex w-full items-center justify-between">
          <div className="text-slate-500 text-xs">{metric.label}</div>
          {metric.icon && <metric.icon className="w-6 h-6 text-slate-500" />}
        </div>
        {metric.isLoading ? (
          <div className="bg-slate-200 dark:bg-slate-800 animate-pulse h-6 w-16 rounded-md mt-1" />
        ) : (
          <div className="text-xl font-semibold text-slate-900 dark:text-slate-50 mt-auto">
            {metric.value} {metric.labelUnits}
          </div>
        )}
      </dd>
    </Card>
  );
}
