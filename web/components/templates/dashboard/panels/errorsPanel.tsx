import { UserGroupIcon } from "@heroicons/react/24/outline";
import { useErrorPageOvertime } from "../../../../services/hooks/useCachePage";
import { useErrorPageCodes } from "../../../../services/hooks/useErrorPage";
import ThemedPieChart from "../../cache/modelPIeChart";
import { MultilineRenderLineChart } from "../../cache/timeGraph";

interface ErrorsPanelProps {}

const ErrorsPanel = (props: ErrorsPanelProps) => {
  const {} = props;

  const pageCodes = useErrorPageCodes();

  const errorCodesOverTime = useErrorPageOvertime();

  console.log(errorCodesOverTime.overTime.data);

  return (
    <div className="grid grid-cols-5 gap-4 h-96">
      <div className="col-span-3 bg-white border border-gray-300 rounded-lg">
        <div className="flex flex-col space-y-4 py-6">
          <h3 className="text-lg font-semibold text-gray-900 text-center">
            Errors
          </h3>
          <div className="h-72 px-4">
            <MultilineRenderLineChart
              data={errorCodesOverTime.overTime.data?.data ?? []}
              timeMap={(x) => new Date(x).toDateString()}
              valueFormatter={(x) => `${x}`}
            />
          </div>
        </div>
      </div>
      <div className="col-span-2 bg-white border border-gray-300 rounded-lg">
        <div className="flex flex-col space-y-4 py-6">
          <h3 className="text-lg font-semibold text-gray-900 text-center">
            Errors
          </h3>
          <div className="h-72">
            <ThemedPieChart
              data={
                pageCodes.errorCodes.data?.data
                  ?.filter((x) => x.error_code !== 200)
                  .map((x) => ({
                    name: "" + x.error_code,
                    value: +x.count,
                  })) ?? []
              }
              isLoading={pageCodes.errorCodes.isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorsPanel;
