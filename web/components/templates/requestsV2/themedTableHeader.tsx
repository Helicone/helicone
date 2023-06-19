import { FunnelIcon, ViewColumnsIcon } from "@heroicons/react/24/outline";
import { Column } from "@tanstack/react-table";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { clsx } from "../../shared/clsx";
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
}

export default function ThemedTableHeader<T>(props: ThemedTableHeaderProps<T>) {
  const {
    columns,
    onSelectAll,
    visibleColumns,
    rows,
    onTimeFilter,
    currentRange,
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
        <div className="flex w-full bg-white h-32 rounded-lg border border-dashed border-gray-300 shadow-sm"></div>
      )}
    </div>
  );
}
