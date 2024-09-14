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
    <Card className="h-full flex flex-col">
      <dd className="text-black dark:text-white flex flex-col flex-grow">
        <div className="flex w-full items-center justify-between">
          <div className="text-gray-500 text-xs">{metric.label}</div>
          {metric.icon && <metric.icon className="w-6 h-6" />}
        </div>
        {metric.isLoading ? (
          <div className="bg-gray-200 dark:bg-gray-800 animate-pulse h-6 w-16 rounded-md mt-1" />
        ) : (
          <div className="text-xl font-semibold text-black dark:text-white mt-auto">
            {metric.value} {metric.labelUnits}
          </div>
        )}
      </dd>
    </Card>
  );
}
