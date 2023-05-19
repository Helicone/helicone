import { UserGroupIcon } from "@heroicons/react/24/outline";
import { Result } from "../../../../lib/result";
import { RequestsOverTime } from "../../../../lib/timeCalculations/fetchTimeData";
import { useGetTopUsers } from "../../../../services/hooks/dashboard";
import {
  filterListToTree,
  FilterNode,
  filterUIToFilterLeafs,
} from "../../../../services/lib/filters/filterDefs";
import { userTableFilters } from "../../../../services/lib/filters/frontendFilterDefs";
import LoadingAnimation from "../../../shared/loadingAnimation";
import { RenderBarChart } from "../../../shared/metrics/barChart";
import ThemedListItem from "../../../shared/themed/themedListItem";
import { Loading } from "../dashboardPage";

interface RequestsPanelProps {
  requestsOverTime: Loading<Result<RequestsOverTime[], string>>;
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

const RequestsPanel = (props: RequestsPanelProps) => {
  const { requestsOverTime, timeMap, advancedFilters } = props;

  const { data, isLoading } = useGetTopUsers(
    1,
    10,
    {
      total_requests: "desc",
    },
    advancedFilters
  );

  return (
    <div className="grid grid-cols-5 gap-4 h-96">
      <div className="col-span-5 md:col-span-3 bg-white border border-gray-300 rounded-lg">
        <div className="flex flex-col space-y-4 py-6">
          <h3 className="text-lg font-semibold text-gray-900 text-center">
            Requests
          </h3>
          <div className="h-72 px-4">
            {requestsOverTime === "loading" ? (
              <div className="h-full w-full flex-col flex p-8">
                <div className="h-full w-full rounded-lg bg-gray-300 animate-pulse" />
              </div>
            ) : (
              <RenderBarChart
                data={unwrapDefaultEmpty(requestsOverTime).map((r) => ({
                  ...r,
                  value: r.count,
                }))}
                timeMap={timeMap}
                valueLabel="requests"
              />
            )}
          </div>
        </div>
      </div>
      <div className="col-span-5 md:col-span-2 bg-white border border-gray-300 rounded-lg">
        <div className="flex flex-col space-y-4 py-6">
          <h3 className="text-lg font-semibold text-gray-900 text-center">
            Top Users by Request
          </h3>
          <ul className="h-72 px-4 overflow-auto divide-y divide-gray-300">
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              data?.data?.map((user, i) => (
                <ThemedListItem
                  key={1}
                  onClickHandler={() => {}}
                  title={user.user_id || "n/a"}
                  subtitle={`Active For: ${user.active_for} days`}
                  value={user.total_requests}
                />
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RequestsPanel;
