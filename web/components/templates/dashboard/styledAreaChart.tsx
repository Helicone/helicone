import { Card, CardContent } from "@/components/ui/card";
import LoadingAnimation from "../../shared/loadingAnimation";
import { cn } from "@/lib/utils";

interface StyledAreaChartProps {
  title: string;
  value: string | number | undefined;
  isDataOverTimeLoading: boolean;
  withAnimation?: boolean;
  height?: string;
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
    <Card className="h-full overflow-y-auto">
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-0.5">
          <p className="text-slate-500 text-sm">{title}</p>
          {value !== undefined && (
            <p className="text-black dark:text-white text-xl font-semibold">
              {value}
            </p>
          )}
        </div>
        <div
          className={cn(value ? "p-2" : "py-4", "w-full")}
          style={{
            height: calculateHeight(),
          }}
        >
          {isDataOverTimeLoading ? (
            <div className="h-full w-full bg-slate-200 dark:bg-slate-800 rounded-md pt-4">
              {withAnimation && <LoadingAnimation height={175} width={175} />}
            </div>
          ) : (
            <>{children}</>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StyledAreaChart;
