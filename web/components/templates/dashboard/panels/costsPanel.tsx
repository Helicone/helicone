import { UserGroupIcon } from "@heroicons/react/24/outline";
import { Result } from "../../../../lib/result";
import { CostOverTime } from "../../../../pages/api/metrics/costOverTime";
import { useGetTopUsers } from "../../../../services/hooks/dashboard";
import { FilterNode } from "../../../../services/lib/filters/filterDefs";
import { RenderBarChart } from "../../../shared/metrics/barChart";
import ThemedListItem from "../../../shared/themed/themedListItem";
import { getUSDate } from "../../../shared/utils/utils";
import { Loading } from "../dashboardPage";

interface CostPanelProps {
  costOverTime: Loading<Result<CostOverTime[], string>>;
  timeMap: (date: Date) => string;
  advancedFilters: FilterNode;
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

const CostPanel = (props: CostPanelProps) => {
  const { costOverTime, timeMap, advancedFilters } = props;

  const { data, isLoading } = useGetTopUsers(
    1,
    10,
    {
      cost: "desc",
    },
    advancedFilters
  );

  return (
    <div className="grid grid-cols-5 gap-4 h-96">
      <div className="col-span-5 bg-white border border-gray-300 rounded-lg">
        <div className="flex flex-col space-y-4 py-6">
          <h3 className="text-lg font-semibold text-gray-900 text-center">
            Costs
          </h3>
          <div className="h-72 px-4">
            {costOverTime === "loading" ? (
              <div className="h-full w-full flex-col flex p-8">
                <div className="h-full w-full rounded-lg bg-gray-300 animate-pulse" />
              </div>
            ) : (
              <RenderBarChart
                data={unwrapDefaultEmpty(costOverTime).map((r) => ({
                  ...r,
                  value: r.cost,
                }))}
                timeMap={timeMap}
                valueLabel="costs"
              />
            )}
          </div>
        </div>
      </div>
      {/* <div className="col-span-5 md:col-span-2 bg-white border border-gray-300 rounded-lg">
        <div className="flex flex-col space-y-4 py-6">
          <h3 className="text-lg font-semibold text-gray-900 text-center">
            Top Users by Cost
          </h3>
          <ul className="h-72 px-4 overflow-auto divide-y divide-gray-300">
            {isLoading ? (
              <div className="flex flex-col space-y-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <li
                    key={index}
                    className="h-6 flex flex-row justify-between gap-2 bg-gray-300 animate-pulse rounded-md"
                  ></li>
                ))}
              </div>
            ) : (
              data?.data?.map((user, i) => (
                <ThemedListItem
                  key={i}
                  onClickHandler={() => {}}
                  title={user.user_id || "n/a"}
                  subtitle={`Last Active: ${getUSDate(
                    user.last_active.toLocaleString()
                  )}`}
                  value={`$${user.cost.toFixed(2)}`}
                />
              ))
            )}
          </ul>
        </div>
      </div> */}
    </div>
  );
};

export default CostPanel;
