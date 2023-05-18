import { UserGroupIcon } from "@heroicons/react/24/outline";
import {
  useErrorPageCodes,
  useErrorPageOverTime,
} from "../../../../services/hooks/useErrorPage";
import { StackedBarChart } from "../../../shared/metrics/stackedBarChart";
import { RenderPieChart } from "../../../shared/metrics/pieChart";

interface ErrorsPanelProps {}

const ErrorsPanel = (props: ErrorsPanelProps) => {
  const {} = props;

  const pageCodes = useErrorPageCodes();

  const errorCodesOverTime = useErrorPageOverTime();

  const data = errorCodesOverTime.overTime.data?.data ?? [];

  const timeMap = (x: Date) => new Date(x).toDateString();

  const chartData = data.map((d) => ({
    ...d,
    time: timeMap(d.time),
  }));

  const getErrorCodes = () => {
    const errorCodes = new Set<string>();
    chartData.forEach((d) => {
      Object.keys(d).forEach((key) => {
        if (key !== "time") {
          errorCodes.add(key);
        }
      });
    });
    return Array.from(errorCodes);
  };

  const errorCodes = getErrorCodes();

  return (
    <div className="grid grid-cols-5 gap-4 h-96">
      <div className="col-span-3 bg-white border border-gray-300 rounded-lg">
        <div className="flex flex-col space-y-4 py-6">
          <h3 className="text-lg font-semibold text-gray-900 text-center">
            Errors
          </h3>
          <div className="h-72 px-4">
            {errorCodesOverTime.overTime.isLoading ? (
              <div className="h-full w-full flex-col flex p-8">
                <div className="h-full w-full rounded-lg bg-gray-300 animate-pulse" />
              </div>
            ) : (
              <StackedBarChart data={chartData} keys={errorCodes} />
            )}
          </div>
        </div>
      </div>
      <div className="col-span-2 bg-white border border-gray-300 rounded-lg">
        <div className="flex flex-col space-y-4 py-6">
          <h3 className="text-lg font-semibold text-gray-900 text-center">
            Distribution
          </h3>
          <div className="h-72">
            {pageCodes.errorCodes.isLoading ? (
              <div className="h-full w-full flex-col flex p-8">
                <div className="h-full w-full rounded-lg bg-gray-300 animate-pulse" />
              </div>
            ) : (
              <RenderPieChart
                data={
                  pageCodes.errorCodes.data?.data
                    ?.filter((x) => x.error_code !== 200)
                    .map((x) => ({
                      name: "" + x.error_code,
                      value: +x.count,
                    })) ?? []
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorsPanel;
