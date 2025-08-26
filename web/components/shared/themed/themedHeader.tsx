import FilterASTButton from "@/filterAST/FilterASTButton";
import { TimeFilter } from "@/types/timeFilter";
import { Menu } from "@headlessui/react";
import { ArrowDownTrayIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";
import { UserMetric } from "../../../lib/api/users/UserMetric";
import { TimeInterval } from "../../../lib/timeCalculations/time";
import { FilterLeaf } from "@helicone-package/filters/filterDefs";
import { ColumnType } from "@helicone-package/filters/frontendFilterDefs";
import { OrganizationFilter } from "../../../services/lib/organization_layout/organization_layout";
import { SortDirection } from "../../../services/lib/sorts/requests/sorts";
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
    isLive?: boolean;
    hasCustomTimeFilter?: boolean;
    onClearTimeFilter?: () => void;
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

export default function ThemedHeader({
  isFetching,
  editColumns,
  timeFilter,
  csvExport,
}: ThemedHeaderProps) {
  const [exportFiltered, setExportFiltered] = useState(false);

  return (
    <>
      {/* Filters */}
      <div aria-labelledby="filter-heading" className="grid items-center">
        <h2 id="filter-heading" className="sr-only">
          Filters
        </h2>
        <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:gap-2">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-2">
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
                isLive={timeFilter.isLive}
                hasCustomTimeFilter={timeFilter.hasCustomTimeFilter}
                onClearTimeFilter={timeFilter.onClearTimeFilter}
              />
            )}
          </div>
          <div className="flex flex-wrap items-center space-x-2">
            <FilterASTButton />
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
                    className="flex flex-row items-center gap-2 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 hover:bg-sky-50"
                  >
                    <ArrowDownTrayIcon
                      className="h-5 w-5 text-gray-900"
                      aria-hidden="true"
                    />
                    <p className="hidden text-sm font-medium text-gray-900 sm:block">
                      Export
                    </p>
                  </button>
                </Menu>
              </div>
            )}
          </div>
        </div>
      </div>
      {csvExport && (
        <ThemedModal
          open={csvExport.openExport}
          setOpen={csvExport.setOpenExport}
        >
          <div className="flex w-full min-w-[350px] max-w-sm flex-col space-y-4 sm:space-y-8">
            <div className="flex flex-col space-y-8">
              <div className="flex flex-col space-y-4">
                <p className="text-md font-semibold text-gray-900 sm:text-lg">
                  Export CSV
                </p>
                <p className="sm:text-md text-sm text-gray-600">
                  Exporting by CSV is limited to 500 rows due to the huge
                  amounts of data in the requests. For larger exports, please
                  use our{" "}
                  <Link
                    href="https://docs.helicone.ai/helicone-api/getting-started"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-600 underline"
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
                        className="h-4 w-4 border-gray-300 text-sky-600 hover:cursor-pointer focus:ring-sky-600"
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
              <p className="sm:text-md text-sm text-gray-600">
                Export may take a lot of time. Please do not close this modal
                once export is started.
              </p>
            </div>

            <div className="flex w-full justify-end space-x-4 text-sm">
              <button
                type="button"
                onClick={() => csvExport.setOpenExport(false)}
                className="flex flex-row items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
              >
                Cancel
              </button>
              <button
                className="text-md flex items-center rounded-md bg-black px-4 py-2 font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                onClick={() => csvExport.onClick(exportFiltered)}
              >
                {csvExport.downloadingCSV ? (
                  <>
                    <ArrowPathIcon
                      className={clsx("mr-2 inline h-5 w-5 animate-spin")}
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
