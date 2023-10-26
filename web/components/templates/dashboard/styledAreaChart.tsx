import { Card, Title, AreaChart } from "@tremor/react";
import { Style } from "util";
import LoadingAnimation from "../../shared/loadingAnimation";
import * as boxbee from "../../../public/lottie/boxbee.json";

interface StyledAreaChartProps {
  title: string;
  value: string | number | undefined;
  isDataOverTimeLoading: boolean;
  withAnimation?: boolean;
  height?: string;
  children: React.ReactNode;
}

const DEFAULT_HEIGHT = "224px";

const StyledAreaChart = (props: StyledAreaChartProps) => {
  const {
    title,
    value,
    isDataOverTimeLoading,
    withAnimation,
    height = DEFAULT_HEIGHT,
    children,
  } = props;
  return (
    <Card>
      <div className="flex flex-col space-y-0.5">
        <p className="text-gray-500 text-sm">{title}</p>
        {value && <p className="text-black text-xl font-semibold">{value}</p>}
      </div>
      <div
        className="p-2 w-full"
        style={{
          height: height,
        }}
      >
        {isDataOverTimeLoading ? (
          <div className="h-full w-full bg-gray-200 rounded-md pt-4">
            {withAnimation && <LoadingAnimation height={175} width={175} />}
          </div>
        ) : (
          <>{children}</>
        )}
      </div>
    </Card>
  );
};

export default StyledAreaChart;
