import { CircleStackIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { Column } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { Result } from "../../../../lib/result";
import { TimeInterval } from "../../../../lib/timeCalculations/time";
import { SingleFilterDef } from "../../../../services/lib/filters/frontendFilterDefs";
import { clsx } from "../../clsx";
import { AdvancedFilters } from "../themedAdvancedFilters";
import ThemedTimeFilter from "../themedTimeFilter";
import ExportButton from "./exportButton";
import ViewColumns from "./columns/viewColumns";
import useSearchParams from "../../utils/useSearchParams";
import { TimeFilter } from "../../../templates/dashboard/dashboardPage";
import ViewButton from "./viewButton";
import { RequestViews } from "./themedTable";
import { OrganizationFilter } from "../../../../services/lib/organization_layout/organization_layout";
import FiltersButton from "./filtersButton";
import { DragColumnItem } from "./columns/DragList";
import SortButton from "./columns/sortButton";
import { UIFilterRowTree } from "../../../../services/lib/filters/uiFilterRowTree";
import React from "react";

interface ThemedTableHeaderProps<T> {
  rows?: T[];

  // define this if you want the advanced filters
  advancedFilters?: {
    filterMap: SingleFilterDef<any>[];
    filters: UIFilterRowTree;
    setAdvancedFilters: (filters: UIFilterRowTree) => void;
    searchPropertyFilters: (
      property: string,
      search: string
    ) => Promise<Result<void, string>>;
    show?: boolean;
  };
  columns: Column<T, unknown>[];

  // define this if you want the time filter
  timeFilter?: {
    currentTimeFilter: TimeFilter;
    defaultValue: "24h" | "7d" | "1m" | "3m" | "all";
    onTimeSelectHandler: (key: TimeInterval, value: string) => void;
  };

  // define this if you want a table and view toggle
  viewToggle?: {
    currentView: RequestViews;
    onViewChange: (value: RequestViews) => void;
  };
  onDataSet?: () => void;
  savedFilters?: {
    filters?: OrganizationFilter[];
    currentFilter?: string;
    onFilterChange?: (value: OrganizationFilter | null) => void;
    onSaveFilterCallback?: () => void;
    layoutPage: "dashboard" | "requests";
  };
  activeColumns: DragColumnItem[];
  setActiveColumns: (columns: DragColumnItem[]) => void;
  customButtons?: React.ReactNode[];
}

export default function ThemedTableHeader<T>(props: ThemedTableHeaderProps<T>) {
  const {
    rows,
    columns,
    timeFilter,
    advancedFilters,
    viewToggle,
    savedFilters,
    activeColumns,
    setActiveColumns,
    customButtons,
  } = props;

  const searchParams = useSearchParams();

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const displayFilters = window.sessionStorage.getItem("showFilters") || null;
    setShowFilters(displayFilters ? JSON.parse(displayFilters) : false);
  }, []);

  const showFilterHandler = () => {
    setShowFilters(!showFilters);
    window.sessionStorage.setItem("showFilters", JSON.stringify(!showFilters));
  };

  const getDefaultValue = () => {
    const currentTimeFilter = searchParams.get("t");

    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      return "custom";
    } else {
      return currentTimeFilter || "24h";
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row justify-between">
        {timeFilter !== undefined ? (
          <ThemedTimeFilter
            currentTimeFilter={timeFilter.currentTimeFilter}
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
            defaultValue={getDefaultValue()}
            custom={true}
          />
        ) : (
          <div />
        )}

        <div className="flex flex-wrap justify-start lg:justify-end gap-2 items-center">
          {advancedFilters && (
            <button
              onClick={showFilterHandler}
              className={clsx(
                "w-max bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
              )}
            >
              <FunnelIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block">
                {showFilters ? "Hide" : "Show"} Filters
                {/* TODO {advancedFilters.filters.length > 0 &&
                  ` (${advancedFilters.filters.length})`} */}
              </p>
            </button>
          )}

          {savedFilters && (
            <FiltersButton
              filters={savedFilters.filters}
              currentFilter={savedFilters.currentFilter}
              onFilterChange={savedFilters.onFilterChange}
              onDeleteCallback={() => {
                if (savedFilters.onSaveFilterCallback) {
                  savedFilters.onSaveFilterCallback();
                }
              }}
              layoutPage={savedFilters.layoutPage}
            />
          )}

          {columns && (
            <ViewColumns
              columns={columns}
              activeColumns={activeColumns}
              setActiveColumns={setActiveColumns}
            />
          )}

          {customButtons &&
            customButtons.map((button, index) => (
              <React.Fragment key={index}>{button}</React.Fragment>
            ))}

          {columns &&
            columns.filter((column) => column.columnDef.meta?.sortKey).length >
              0 && <SortButton columns={columns} />}
          {rows && <ExportButton rows={rows} />}

          {viewToggle && (
            <ViewButton
              currentView={viewToggle.currentView}
              onViewChange={(value: RequestViews) => {
                viewToggle.onViewChange(value);
              }}
            />
          )}
          {advancedFilters && props.onDataSet && (
            <button
              onClick={() => {
                if (props.onDataSet) {
                  props.onDataSet();
                }
              }}
              className={clsx(
                "bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
              )}
            >
              <CircleStackIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block">
                {"Create Dataset"}
              </p>
            </button>
          )}
        </div>
      </div>

      {advancedFilters && showFilters && (
        <AdvancedFilters
          filterMap={advancedFilters.filterMap}
          filters={advancedFilters.filters}
          setAdvancedFilters={advancedFilters.setAdvancedFilters}
          searchPropertyFilters={advancedFilters.searchPropertyFilters}
          savedFilters={savedFilters?.filters}
          onSaveFilterCallback={savedFilters?.onSaveFilterCallback}
          layoutPage={savedFilters?.layoutPage ?? "requests"}
        />
      )}
    </div>
  );
}
