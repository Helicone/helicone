import { Card, Title, AreaChart } from "@tremor/react";
import { Style } from "util";
import LoadingAnimation from "../../shared/loadingAnimation";
import * as boxbee from "../../../public/lottie/boxbee.json";

interface StyledAreaChartProps {
  title: string;
  value: string | number;
  isDataOverTimeLoading: boolean;
  withAnimation?: boolean;
  children: React.ReactNode;
}

const StyledAreaChart = (props: StyledAreaChartProps) => {
  const { title, value, isDataOverTimeLoading, withAnimation, children } =
    props;
  return (
    <Card>
      <div className="flex flex-col space-y-0.5">
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-black text-xl font-semibold">{value}</p>
      </div>
      {isDataOverTimeLoading ? (
        <div className="p-2 w-full h-[14rem]">
          <div className="h-full w-full bg-gray-200 rounded-md pt-4">
            {withAnimation && <LoadingAnimation height={175} width={175} />}
          </div>
        </div>
      ) : (
        <>{children}</>
      )}
    </Card>
  );
};

export default StyledAreaChart;
