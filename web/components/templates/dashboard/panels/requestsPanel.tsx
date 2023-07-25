import {
  EllipsisVerticalIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
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
import { getUSDate } from "../../../shared/utils/utils";
import { Loading } from "../dashboardPage";
import MainGraph from "../graphs/mainGraph";

interface RequestsPanelProps {
  requestsOverTime: RequestsOverTime[];
  isLoading: boolean;
  timeMap: (date: Date) => string;
  advancedFilters: FilterNode;
}

const RequestsPanel = (props: RequestsPanelProps) => {
  const { requestsOverTime, timeMap, advancedFilters, isLoading } = props;

  return (
    <MainGraph
      isLoading={false}
      dataOverTime={[]}
      timeMap={function (date: Date): string {
        throw new Error("Function not implemented.");
      }}
    />
    // <div className="col-span-2 xl:col-span-1 h-96">
    //   <div className="bg-white border border-gray-300 rounded-lg px-4 pt-4 shadow-md">
    //     <div className="flex flex-col space-y-4">
    //       <div className="flex flex-row w-full justify-between items-start">
    //         <div className="flex flex-col space-y-0.5">
    //           <p className="text-sm text-gray-700">Requests</p>
    //           <h3 className="text-3xl font-semibold text-gray-900">1,231</h3>
    //         </div>
    //         <EllipsisVerticalIcon className="h-6 w-6 text-gray-500" />
    //       </div>
    //       <div className="h-40">
    //         {isLoading ? (
    //           <div className="h-full w-full flex-col flex p-8">
    //             <div className="h-full w-full rounded-lg bg-gray-300 animate-pulse" />
    //           </div>
    //         ) : (
    //           <RenderBarChart
    //             data={requestsOverTime.map((r) => ({
    //               ...r,
    //               value: r.count,
    //             }))}
    //             timeMap={timeMap}
    //             valueLabel="requests"
    //           />
    //         )}
    //       </div>
    //     </div>
    //   </div>
    // </div>
  );
};

export default RequestsPanel;
