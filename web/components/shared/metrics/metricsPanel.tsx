interface MetricsPanelProps {
  metric: {
    isLoading: boolean;
    value: number | string;
    label: string;
    icon: React.ForwardRefExoticComponent<
      React.SVGProps<SVGSVGElement> & {
        title?: string | undefined;
        titleId?: string | undefined;
      }
    >;
  };
}

export function MetricsPanel(props: MetricsPanelProps) {
  const { metric } = props;

  return (
    <div
      className="p-6 bg-white border border-gray-300 rounded-lg space-y-2"
      key={metric.label}
    >
      <div className="w-full flex flex-row items-center justify-between">
        <div className="text-sm  text-gray-700">{metric.label}</div>
        {<metric.icon className="h-5 w-5" aria-hidden="true" />}
      </div>

      <div className="text-2xl font-semibold">
        {metric.isLoading ? (
          <div className="h-8 w-16 bg-gray-300 rounded-lg animate-pulse" />
        ) : (
          metric.value
        )}
      </div>
    </div>
  );
}
