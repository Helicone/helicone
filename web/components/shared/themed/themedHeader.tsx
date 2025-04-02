import { UIFilterRowTree } from "@/services/lib/filters/types";
import { TimeFilter } from "@/types/timeFilter";
import { Menu } from "@headlessui/react";
import { ArrowDownTrayIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";
import { UserMetric } from "../../../lib/api/users/UserMetric";
import { Result } from "../../../lib/result";
import { TimeInterval } from "../../../lib/timeCalculations/time";
import { FilterLeaf } from "../../../services/lib/filters/filterDefs";
import {
  ColumnType,
  SingleFilterDef,
} from "../../../services/lib/filters/frontendFilterDefs";
import { OrganizationFilter } from "../../../services/lib/organization_layout/organization_layout";
import { SortDirection } from "../../../services/lib/sorts/requests/sorts";
import FilterASTButton from "@/filterAST/FilterASTButton";
import { clsx } from "../clsx";
import ThemedModal from "./themedModal";
import { ThemedMultiSelect } from "./themedMultiSelect";
import ThemedTimeFilter from "./themedTimeFilter";
export interface Column {
  key: keyof UserMetric;
  label: string;
  active: boolean;
  type?: ColumnType;
  filter?: boolean;
  sortBy?: SortDirection;
  columnOrigin?: "property" | "value" | "feedback";
  minWidth?: number;
  align?: "center" | "inherit" | "left" | "right" | "justify";
  toSortLeaf?: (direction: SortDirection) => any;
  format?: (value: any, mode: "Condensed" | "Expanded") => string;
}

export function escapeCSVString(s: string | undefined): string | undefined {
  if (s === undefined) {
    return undefined;
  }
  return s.replace(/"/g, '""');
}
export type Filter = FilterLeaf;

interface ThemedHeaderProps {
  isFetching: boolean; // if fetching, we disable other time select buttons
  editColumns?: {
    columns: Column[];
    onColumnCallback: (columns: Column[]) => void;
  };
  csvExport?: {
    onClick: (filtered: boolean) => void;
    downloadingCSV: boolean;
    openExport: boolean;
    setOpenExport: (open: boolean) => void;
  };
  timeFilter?: {
    currentTimeFilter: TimeFilter;
    timeFilterOptions: { key: string; value: string }[];
    customTimeFilter: boolean;
    onTimeSelectHandler: (key: TimeInterval, value: string) => void;
    defaultTimeFilter: TimeInterval;
  };
  advancedFilter?: {
    filterMap: SingleFilterDef<any>[];
    onAdvancedFilter: (filters: UIFilterRowTree) => void;
    filters: UIFilterRowTree;
    searchPropertyFilters: (
      property: string,
      search: string
    ) => Promise<Result<void, string>>;
  };
  savedFilters?: {
    filters?: OrganizationFilter[];
    currentFilter?: string;
    onFilterChange?: (value: OrganizationFilter | null) => void;
    onSaveFilterCallback?: () => void;
    layoutPage: "dashboard" | "requests";
  };
}

const notificationMethods = [
  { id: "filtered", title: "Only selected columns", filtered: true },
  { id: "all", title: "All event properties", filtered: false },
];

const countFilters = (filters: UIFilterRowTree): number => {
  if ("operator" in filters) {
    return filters.rows.reduce((acc, row) => acc + countFilters(row), 0);
  } else {
    return 1;
  }
};

export default function ThemedHeader(props: ThemedHeaderProps) {
  const {
    isFetching,
    editColumns,
    timeFilter,
    advancedFilter,
    csvExport,
    savedFilters,
  } = props;

  const [exportFiltered, setExportFiltered] = useState(false);

  return (
    <>
      {/* Filters */}
      <div aria-labelledby="filter-heading" className="grid items-center">
        <h2 id="filter-heading" className="sr-only">
          Filters
        </h2>
        <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-2 lg:items-center">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-2 sm:items-center">
            {timeFilter && (
              <ThemedTimeFilter
                timeFilterOptions={timeFilter.timeFilterOptions}
                isFetching={isFetching}
                onSelect={(key, value) =>
                  timeFilter.onTimeSelectHandler(key as TimeInterval, value)
                }
                defaultValue={timeFilter.defaultTimeFilter ?? "all"}
                currentTimeFilter={timeFilter.currentTimeFilter}
                custom={timeFilter.customTimeFilter}
              />
            )}
          </div>
          {(advancedFilter || editColumns || csvExport) && (
            <div className="flex flex-wrap space-x-2 items-center">
              {advancedFilter && <FilterASTButton />}
              {editColumns && (
                <ThemedMultiSelect
                  columns={editColumns.columns.map((col) => ({
                    active: col.active,
                    label: col.label,
                    value: col.label,
                  }))}
                  buttonLabel="Columns"
                  deselectAll={() => {
                    const newColumns = [...editColumns.columns];

                    newColumns.forEach((col) => {
                      col.active = false;
                    });

                    editColumns.onColumnCallback(newColumns);
                  }}
                  selectAll={() => {
                    const newColumns = [...editColumns.columns];

                    newColumns.forEach((col) => {
                      col.active = true;
                    });

                    editColumns.onColumnCallback(newColumns);
                  }}
                  onSelect={(value) => {
                    const newColumns = [...editColumns.columns];
                    const col = newColumns.find((col) => col.label === value);
                    if (!col) return;
                    col.active = !col.active;

                    editColumns.onColumnCallback(newColumns);
                  }}
                />
              )}
              {csvExport && (
                <div className="mx-auto flex text-sm">
                  <Menu as="div" className="relative inline-block">
                    <button
                      onClick={() => csvExport.setOpenExport(true)}
                      className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white hover:bg-sky-50 flex flex-row items-center gap-2"
                    >
                      <ArrowDownTrayIcon
                        className="h-5 w-5 text-gray-900"
                        aria-hidden="true"
                      />
                      <p className="text-sm font-medium text-gray-900 hidden sm:block">
                        Export
                      </p>
                    </button>
                  </Menu>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {csvExport && (
        <ThemedModal
          open={csvExport.openExport}
          setOpen={csvExport.setOpenExport}
        >
          <div className="flex flex-col space-y-4 sm:space-y-8 min-w-[350px] max-w-sm w-full">
            <div className="flex flex-col space-y-8">
              <div className="flex flex-col space-y-4">
                <p className="text-md sm:text-lg font-semibold text-gray-900">
                  Export CSV
                </p>
                <p className="text-sm sm:text-md text-gray-600">
                  Exporting by CSV is limited to 500 rows due to the huge
                  amounts of data in the requests. For larger exports, please
                  use our{" "}
                  <Link
                    href="https://docs.helicone.ai/helicone-api/getting-started"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold text-blue-600"
                  >
                    API
                  </Link>
                  .
                </p>
              </div>

              <fieldset className="space-y-2">
                <p className="text-xs text-gray-600">Properties on export</p>
                <legend className="sr-only">Notification method</legend>
                <div className="space-y-2">
                  {notificationMethods.map((notificationMethod) => (
                    <div
                      key={notificationMethod.id}
                      className="flex items-center"
                    >
                      <input
                        id={notificationMethod.id}
                        name="notification-method"
                        type="radio"
                        defaultChecked={notificationMethod.id === "filtered"}
                        className="h-4 w-4 border-gray-300 text-sky-600 focus:ring-sky-600 hover:cursor-pointer"
                        onClick={() => {
                          setExportFiltered(notificationMethod.filtered);
                        }}
                      />
                      <label
                        htmlFor={notificationMethod.id}
                        className="ml-3 block text-sm font-medium leading-6 text-gray-600"
                      >
                        {notificationMethod.title}
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
              <p className="text-sm sm:text-md text-gray-600">
                Export may take a lot of time. Please do not close this modal
                once export is started.
              </p>
            </div>

            <div className="w-full flex justify-end text-sm space-x-4">
              <button
                type="button"
                onClick={() => csvExport.setOpenExport(false)}
                className="flex flex-row items-center rounded-md bg-white px-4 py-2 text-sm font-semibold border border-gray-300 hover:bg-gray-50 text-gray-900 shadow-sm hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
              >
                Cancel
              </button>
              <button
                className="items-center rounded-md bg-black px-4 py-2 text-md flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                onClick={() => csvExport.onClick(exportFiltered)}
              >
                {csvExport.downloadingCSV ? (
                  <>
                    <ArrowPathIcon
                      className={clsx("h-5 w-5 inline animate-spin mr-2")}
                    />
                    Exporting
                  </>
                ) : (
                  <p>Export</p>
                )}
              </button>
            </div>
          </div>
        </ThemedModal>
      )}
    </>
  );
}
