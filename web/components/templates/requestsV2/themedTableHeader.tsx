import { FunnelIcon, ViewColumnsIcon } from "@heroicons/react/24/outline";
import { Column } from "@tanstack/react-table";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { Result } from "../../../lib/result";
import { SingleFilterDef } from "../../../services/lib/filters/frontendFilterDefs";
import { clsx } from "../../shared/clsx";
import {
  AdvancedFilters,
  UIFilterRow,
} from "../../shared/themed/themedAdvancedFilters";
import { ThemedPill } from "../../shared/themed/themedPill";
import DatePicker from "./datePicker";
import ExportButton from "./exportButton";
import ViewColumns from "./viewColumns";

interface ThemedTableHeaderProps<T> {
  columns: Column<T, unknown>[];
  rows: T[];
  onSelectAll: (value?: boolean | undefined) => void;
  visibleColumns: number;
  onTimeFilter: (range: DateRange | undefined) => void;
  currentRange: DateRange | undefined;

  // TODO: rewrite these filters
  filterMap: SingleFilterDef<any>[];
  filters: UIFilterRow[];
  setAdvancedFilters: Dispatch<SetStateAction<UIFilterRow[]>>;
  searchPropertyFilters: (
    property: string,
    search: string
  ) => Promise<Result<void, string>>;
}

export default function ThemedTableHeader<T>(props: ThemedTableHeaderProps<T>) {
  const {
    columns,
    onSelectAll,
    visibleColumns,
    rows,
    onTimeFilter,
    currentRange,
    filterMap,
    filters,
    setAdvancedFilters,
    searchPropertyFilters,
  } = props;

  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-row justify-between">
        <DatePicker currentRange={currentRange} onTimeFilter={onTimeFilter} />
        <div className="flex flex-row gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              "bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 hover:bg-sky-50 flex flex-row items-center gap-2"
            )}
          >
            <FunnelIcon className="h-5 w-5 text-gray-900" />
            <p className="text-sm font-medium text-gray-900">
              {showFilters ? "Hide" : "Show"} Filters
            </p>
          </button>
          <ViewColumns
            columns={columns}
            onSelectAll={onSelectAll}
            visibleColumns={visibleColumns}
          />
          <ExportButton rows={rows} />
        </div>
      </div>
      {showFilters && (
        <AdvancedFilters
          filterMap={filterMap}
          filters={filters}
          setAdvancedFilters={setAdvancedFilters}
          searchPropertyFilters={searchPropertyFilters}
        />
      )}
      {filters.length > 0 && !showFilters && (
        <div className="flex-wrap w-full flex-row space-x-4 space-y-2 mt-4">
          {filters.map((_filter, index) => {
            return (
              <ThemedPill
                key={index}
                label={`${filterMap[_filter.filterMapIdx]?.label} ${
                  filterMap[_filter.filterMapIdx]?.operators[
                    _filter.operatorIdx
                  ].label
                } ${_filter.value}`}
                onDelete={() => {
                  setAdvancedFilters((prev) => {
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
