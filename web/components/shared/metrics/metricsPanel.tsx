import { InformationCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export interface MetricsPanelProps {
  metric: {
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
}

export function MetricsPanel(props: MetricsPanelProps) {
  const { metric } = props;
  const onInformationHref = metric.onInformationHref;

  return (
    <div
      className="p-6 bg-white border border-gray-300 rounded-lg shadow-md space-y-2"
      key={metric.label}
    >
      <div className="w-full flex flex-row items-center justify-between">
        <div className="text-sm  text-gray-700 flex flex-row gap-1 items-center">
          {metric.label}
          {onInformationHref && (
            <Link href={onInformationHref} target="_blank">
              <InformationCircleIcon
                className="h-5 w-5 text-gray-500"
                aria-hidden="true"
              />
            </Link>
          )}
        </div>
        {<metric.icon className="h-5 w-5" aria-hidden="true" />}
      </div>

      <div className="text-2xl font-semibold flex flex-row items-end gap-1">
        {metric.isLoading ? (
          <div className="h-8 w-16 bg-gray-300 rounded-lg animate-pulse" />
        ) : (
          metric.value
        )}
        <div className="text-gray-400 text-xs pb-1">
          {metric.isLoading || metric.labelUnits}
        </div>
      </div>
    </div>
  );
}
