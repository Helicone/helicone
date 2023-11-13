import { InformationCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { Card, Metric, Text } from "@tremor/react";
import { clsx } from "../clsx";

export interface MetricsPanelProps {
  metric: {
    id: string;
    isLoading: boolean;
    value: number | string;
    label: string;
    labelUnits?: string;
    icon: React.ForwardRefExoticComponent<
      React.SVGProps<SVGSVGElement> & {
        title?: string | undefined;
        titleId?: string | undefined;
      }
    >;
    onInformationHref?: string;
  };
  hFull?: boolean;
}

export function MetricsPanel(props: MetricsPanelProps) {
  const { metric, hFull = false } = props;

  return (
    <Card
      className={clsx(
        hFull ? "h-full" : "h-full max-h-24",
        "flex flex-col p-4 w-full justify-end"
      )}
    >
      <p className="text-gray-500 text-xs text-left">{metric.label}</p>
      {metric.isLoading ? (
        <div className="bg-gray-200 dark:bg-gray-800 animate-pulse h-6 w-16 rounded-md mt-1" />
      ) : (
        <p className="text-black dark:text-white font-semibold text-lg">
          {metric.value}
        </p>
      )}
    </Card>
  );
}
