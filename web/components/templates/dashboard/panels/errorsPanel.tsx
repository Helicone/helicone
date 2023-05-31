import { UseQueryResult } from "@tanstack/react-query";
import { getErrorCodes } from "../../../../lib/api/metrics/errorCodes";
import { Result } from "../../../../lib/result";
import { UnPromise } from "../../../../lib/tsxHelpers";
import { RenderBarChart } from "../../../shared/metrics/barChart";
import { RenderPieChart } from "../../../shared/metrics/pieChart";
import { Loading } from "../dashboardPage";

interface ErrorsPanelProps {
  errorsOverTime: Loading<Result<any[], string>>;
  errorMetrics: UseQueryResult<
    UnPromise<ReturnType<typeof getErrorCodes>>,
    unknown
  >;
}

function unwrapDefaultEmpty<T>(data: Loading<Result<T[], string>>): T[] {
  if (data === "loading") {
    return [];
  }
  if (data.error !== null) {
    return [];
  }
  return data.data;
}

const ErrorsPanel = (props: ErrorsPanelProps) => {
  const { errorsOverTime, errorMetrics } = props;

  const timeMap = (x: Date) => new Date(x).toDateString();

  return (
    <div className="grid grid-cols-5 gap-4 h-96">
      <div className="col-span-3 bg-white border border-gray-300 rounded-lg">
        <div className="flex flex-col space-y-4 py-6">
          <h3 className="text-lg font-semibold text-gray-900 text-center">
            Errors
          </h3>
          <div className="h-72 px-4">
            {errorsOverTime === "loading" ? (
              <div className="h-full w-full flex-col flex p-8">
                <div className="h-full w-full rounded-lg bg-gray-300 animate-pulse" />
              </div>
            ) : (
              <RenderBarChart
                data={unwrapDefaultEmpty(errorsOverTime).map((e) => ({
                  ...e,
                  value: e.count,
                }))}
                timeMap={timeMap}
                valueLabel="errors"
              />
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
            {errorMetrics.isLoading ? (
              <div className="h-full w-full flex-col flex p-8">
                <div className="h-full w-full rounded-lg bg-gray-300 animate-pulse" />
              </div>
            ) : errorMetrics.data?.data?.length === 0 ? (
              <div className="h-full w-full flex-col flex p-8 items-center justify-center align-middle">
                No Errors!
              </div>
            ) : (
              <RenderPieChart
                data={
                  errorMetrics.data?.data
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
