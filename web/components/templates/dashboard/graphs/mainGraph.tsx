import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { RenderAreaChart } from "../../../shared/metrics/areaChart";
import { BarChartData, RenderBarChart } from "../../../shared/metrics/barChart";
import {
  DoubleAreaChartData,
  RenderDoubleAreaChart,
} from "../../../shared/metrics/doubleAreaChart";

interface MainGraphProps {
  isLoading: boolean;
  dataOverTime?: BarChartData[];
  doubleLineOverTime?: DoubleAreaChartData[];
  timeMap: (date: Date) => string;
  title: string;
  value: string | number;
  valueLabel: string;
  valueLabel2?: string;
  type: "double-line" | "bar" | "area";
  labelFormatter?: (value: string) => string;
}

export default function MainGraph(props: MainGraphProps) {
  const {
    isLoading,
    dataOverTime,
    doubleLineOverTime,
    timeMap,
    title,
    value,
    valueLabel,
    valueLabel2,
    type,
    labelFormatter,
  } = props;

  return (
    <div className="bg-white border border-gray-300 rounded-lg px-4 pt-4 h-full">
      <div className="flex flex-col h-full">
        <div className="flex flex-row w-full justify-between items-start">
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm text-gray-700">{title}</p>
            <h3 className="text-xl font-semibold text-gray-900">{value}</h3>
          </div>
        </div>
        <div className="h-full">
          {isLoading ? (
            <div className="h-full w-full flex-col flex p-8">
              <div className="h-full w-full rounded-lg bg-gray-300 animate-pulse" />
            </div>
          ) : type === "bar" && dataOverTime ? (
            <RenderBarChart
              data={dataOverTime}
              timeMap={timeMap}
              valueLabel={valueLabel}
              labelFormatter={labelFormatter}
            />
          ) : type === "area" && dataOverTime ? (
            <RenderAreaChart
              data={dataOverTime}
              timeMap={timeMap}
              valueLabel={valueLabel}
              labelFormatter={labelFormatter}
            />
          ) : type === "double-line" && doubleLineOverTime ? (
            <RenderDoubleAreaChart
              data={doubleLineOverTime}
              timeMap={timeMap}
              valueLabel1={valueLabel}
              valueLabel2={valueLabel2 ?? "errors"}
              labelFormatter={labelFormatter}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
