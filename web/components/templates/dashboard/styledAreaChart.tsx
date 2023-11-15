import { Card, Title, AreaChart } from "@tremor/react";
import { Style } from "util";
import LoadingAnimation from "../../shared/loadingAnimation";
import * as boxbee from "../../../public/lottie/boxbee.json";
import clsx from "clsx";

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

  const calculateHeight = () => {
    // if value is undefined, add 28 to `224px`

    if (!value) {
      return parseInt(height.split("px")[0]) + 30 + "px";
    }
    return height;
  };

  return (
    <Card>
      <div className="flex flex-col space-y-0.5">
        <p className="text-gray-500 text-sm">{title}</p>
        {value && (
          <p className="text-black dark:text-white text-xl font-semibold">
            {value}
          </p>
        )}
      </div>
      <div
        className={clsx(value ? "p-2" : "py-4", "w-full")}
        style={{
          height: calculateHeight(),
        }}
      >
        {isDataOverTimeLoading ? (
          <div className="h-full w-full bg-gray-200 dark:bg-gray-800 rounded-md pt-4">
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
