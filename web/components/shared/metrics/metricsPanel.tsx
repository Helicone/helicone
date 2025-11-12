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
    <div className="flex h-full flex-col border-b border-r border-border bg-card">
      <dd className="flex flex-grow flex-col p-4 text-foreground">
        <div className="flex w-full items-center justify-between">
          <div className="text-[13px] text-muted-foreground">{metric.label}</div>
          {metric.icon && <metric.icon className="h-6 w-6 text-muted-foreground" />}
        </div>
        {metric.isLoading ? (
          <div className="mt-1 h-6 w-16 animate-pulse rounded-md bg-muted" />
        ) : (
          <div className="mt-auto text-xl font-semibold text-foreground">
            {metric.value} {metric.labelUnits}
          </div>
        )}
      </dd>
    </div>
  );
}
