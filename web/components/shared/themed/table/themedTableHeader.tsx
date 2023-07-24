import {
  BoltIcon,
  FunnelIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import { Column } from "@tanstack/react-table";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { Result } from "../../../../lib/result";
import { TimeInterval } from "../../../../lib/timeCalculations/time";
import { SingleFilterDef } from "../../../../services/lib/filters/frontendFilterDefs";
import { clsx } from "../../clsx";
import { AdvancedFilters, UIFilterRow } from "../themedAdvancedFilters";
import { ThemedPill } from "../themedPill";
import ThemedTimeFilter from "../themedTimeFilter";
import ExportButton from "../../../templates/requestsV2/exportButton";
import ViewColumns from "../../../templates/requestsV2/viewColumns";
import { Toggle } from "../themedToggle";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import useNotification from "../../notification/useNotification";

interface ThemedTableHeaderProps<T> {
  rows: T[];

  // define this if you want the advanced filters
  advancedFilters?: {
    filterMap: SingleFilterDef<any>[];
    filters: UIFilterRow[];
    setAdvancedFilters: Dispatch<SetStateAction<UIFilterRow[]>>;
    searchPropertyFilters: (
      property: string,
      search: string
    ) => Promise<Result<void, string>>;
  };

  // define this if you want the columns filter
  columnsFilter?: {
    onSelectAll: (value?: boolean | undefined) => void;
    columns: Column<T, unknown>[];
    visibleColumns: number;
  };

  // define this if you want the time filter
  timeFilter?: {
    defaultValue: "24h" | "7d" | "1m" | "3m" | "all";
    onTimeSelectHandler: (key: TimeInterval, value: string) => void;
  };
}

export default function ThemedTableHeader<T>(props: ThemedTableHeaderProps<T>) {
  const { setNotification } = useNotification();
  const { rows, columnsFilter, timeFilter, advancedFilters } = props;

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const displayFilters = window.localStorage.getItem("showFilters") || null;
    setShowFilters(displayFilters ? JSON.parse(displayFilters) : false);
  }, []);

  const showFilterHandler = () => {
    setShowFilters(!showFilters);
    window.localStorage.setItem("showFilters", JSON.stringify(!showFilters));
  };
  const [isLive, setIsLive] = useLocalStorage("isLive", false);

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row justify-between ">
        {timeFilter !== undefined ? (
          <ThemedTimeFilter
            timeFilterOptions={[
              { key: "24h", value: "24H" },
              { key: "7d", value: "7D" },
              { key: "1m", value: "1M" },
              { key: "3m", value: "3M" },
              { key: "all", value: "All" },
            ]}
            onSelect={function (key: string, value: string): void {
              timeFilter.onTimeSelectHandler(key as TimeInterval, value);
            }}
            isFetching={false}
            defaultValue={"24h"}
            custom={true}
          />
        ) : (
          <div />
        )}
        <div className="flex flex-row gap-2">
          {advancedFilters && (
            <button
              onClick={showFilterHandler}
              className={clsx(
                "bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 hover:bg-sky-50 flex flex-row items-center gap-2"
              )}
            >
              <FunnelIcon className="h-5 w-5 text-gray-900" />
              <p className="text-sm font-medium text-gray-900 hidden sm:block">
                {showFilters ? "Hide" : "Show"} Filters
              </p>
            </button>
          )}
          {columnsFilter && (
            <ViewColumns
              columns={columnsFilter.columns}
              onSelectAll={columnsFilter.onSelectAll}
              visibleColumns={columnsFilter.visibleColumns}
            />
          )}
          {rows.length > 0 && <ExportButton rows={rows} />}
        </div>
      </div>
      {advancedFilters && showFilters && (
        <AdvancedFilters
          filterMap={advancedFilters.filterMap}
          filters={advancedFilters.filters}
          setAdvancedFilters={advancedFilters.setAdvancedFilters}
          searchPropertyFilters={advancedFilters.searchPropertyFilters}
        />
      )}
      {advancedFilters &&
        advancedFilters.filters.length > 0 &&
        !showFilters && (
          <div className="flex-wrap w-full flex-row space-x-4 space-y-2 mt-4">
            {advancedFilters.filters.map((_filter, index) => {
              return (
                <ThemedPill
                  key={index}
                  label={`${
                    advancedFilters.filterMap[_filter.filterMapIdx]?.label
                  } ${
                    advancedFilters.filterMap[_filter.filterMapIdx]?.operators[
                      _filter.operatorIdx
                    ].label
                  } ${_filter.value}`}
                  onDelete={() => {
                    advancedFilters.setAdvancedFilters((prev) => {
                      const newFilters = [...prev];
                      newFilters.splice(index, 1);
                      return newFilters;
                    });
                  }}
                />
              );
            })}
          </div>
        )}
    </div>
  );
}
