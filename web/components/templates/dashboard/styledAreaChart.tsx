import { Card } from "@tremor/react";
import LoadingAnimation from "../../shared/loadingAnimation";
import clsx from "clsx";
import React from "react";

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
    <Card className="rounded-lg border border-slate-200 bg-white text-slate-950 !shadow-sm ring-0 dark:border-slate-800 dark:bg-black dark:text-slate-50">
      <div className="flex flex-col space-y-0.5">
        <p className="text-sm text-slate-500">{title}</p>
        {value !== undefined && (
          <p className="text-xl font-semibold text-black dark:text-white">
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
          <div className="h-full w-full rounded-md bg-slate-200 pt-4 dark:bg-slate-800">
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
