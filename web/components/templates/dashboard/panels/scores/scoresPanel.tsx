import LoadingAnimation from "@/components/shared/loadingAnimation";
import { TimeIncrement } from "@/lib/timeCalculations/fetchTimeData";
import { Card, LineChart } from "@tremor/react";
import clsx from "clsx";
import { FilterNode } from "../../../../../services/lib/filters/filterDefs";
import { TimeFilter } from "../../dashboardPage";
import { useScores } from "./useScores";

export interface ScoresPanelProps {
  timeFilter: TimeFilter;
  userFilters: FilterNode;
  dbIncrement: TimeIncrement;
  filterBool?: boolean;
}

export const ScoresPanel = (props: ScoresPanelProps) => {
  const { timeFilter, userFilters, dbIncrement, filterBool } = props;

  const { scoresQuery, allScores, scoreKeys } = useScores({
    timeFilter,
    userFilters,
    dbIncrement,
    filterBool,
  });

  return (
    <Card className="border border-slate-200 bg-white text-slate-950 shadow-none dark:border-slate-800 dark:bg-black dark:text-slate-50 rounded-lg ring-0">
      <div className="flex flex-row items-center justify-between w-full">
        <div className="flex flex-col space-y-0.5 w-full">
          <p className="text-gray-500 text-sm">
            {filterBool ? "Feedback / Bool Scores" : "Scores"}
          </p>
        </div>
      </div>

      <div
        className={clsx("p-2", "w-full")}
        style={{
          height: "212px",
        }}
      >
        {scoresQuery.isLoading ? (
          <div className="h-full w-full bg-gray-200 dark:bg-gray-800 rounded-md pt-4">
            <LoadingAnimation height={175} width={175} />
          </div>
        ) : (
          <LineChart
            className="h-[14rem]"
            data={allScores ?? []}
            index="date"
            categories={scoreKeys}
            colors={[
              "yellow",
              "red",
              "green",
              "blue",
              "orange",
              "indigo",
              "orange",
              "pink",
            ]}
            showYAxis={false}
            curveType="monotone"
            valueFormatter={(number: number | bigint) => {
              if (filterBool) {
                return `${new Intl.NumberFormat("us").format(
                  Number(number) * 100
                )}%`;
              }
              return `${new Intl.NumberFormat("us").format(Number(number))}`;
            }}
          />
        )}
      </div>
    </Card>
  );
};
