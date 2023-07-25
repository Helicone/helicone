import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { BarChartData, RenderBarChart } from "../../../shared/metrics/barChart";

interface MainGraphProps {
  isLoading: boolean;
  dataOverTime: BarChartData[];
  timeMap: (date: Date) => string;
  title: string;
  value: string | number;
}

export default function MainGraph(props: MainGraphProps) {
  const { isLoading, dataOverTime, timeMap, title, value } = props;

  return (
    <div className="col-span-2 xl:col-span-1 h-96">
      <div className="bg-white border border-gray-300 rounded-lg px-4 pt-4 shadow-md">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-row w-full justify-between items-start">
            <div className="flex flex-col space-y-0.5">
              <p className="text-sm text-gray-700">{title}</p>
              <h3 className="text-3xl font-semibold text-gray-900">{value}</h3>
            </div>
            <EllipsisVerticalIcon className="h-6 w-6 text-gray-500" />
          </div>
          <div className="h-40">
            {isLoading ? (
              <div className="h-full w-full flex-col flex p-8">
                <div className="h-full w-full rounded-lg bg-gray-300 animate-pulse" />
              </div>
            ) : (
              <RenderBarChart
                data={dataOverTime}
                timeMap={timeMap}
                valueLabel="requests"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
