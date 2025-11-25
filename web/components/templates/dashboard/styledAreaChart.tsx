import LoadingAnimation from "../../shared/loadingAnimation";
import clsx from "clsx";

interface StyledAreaChartProps {
  title: string;
  value: string | number | undefined;
  isDataOverTimeLoading: boolean;
  withAnimation?: boolean;
  height?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

const DEFAULT_HEIGHT = "212px";

const StyledAreaChart = (props: StyledAreaChartProps) => {
  const {
    title,
    value,
    isDataOverTimeLoading,
    withAnimation,
    height = DEFAULT_HEIGHT,
    headerAction,
    children,
  } = props;

  const calculateHeight = () => {
    // if value is undefined, add 28 to `212x`

    if (!value) {
      return parseInt(height.split("px")[0]) + 30 + "px";
    }
    return height;
  };

  return (
    <div className="flex h-full flex-col border-b border-r border-border bg-card p-6 text-card-foreground">
      <div className="flex items-start justify-between">
        <div className="flex flex-col space-y-0.5">
          <p className="text-sm text-muted-foreground">{title}</p>
          {value !== undefined && (
            <p className="text-xl font-semibold text-foreground">{value}</p>
          )}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>
      <div
        className={clsx(
          value ? "p-2" : "py-4",
          "w-full",
          height ? "" : "flex-grow",
        )}
        style={{
          height: height ? calculateHeight() : undefined,
        }}
      >
        {isDataOverTimeLoading ? (
          <div className="h-full w-full rounded-md bg-muted pt-4">
            {withAnimation && <LoadingAnimation height={175} width={175} />}
          </div>
        ) : (
          <>{children}</>
        )}
      </div>
    </div>
  );
};

export default StyledAreaChart;
