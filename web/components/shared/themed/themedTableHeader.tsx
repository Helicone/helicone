/*
  This example requires some changes to your config:
  
  ```
  // tailwind.config.js
  module.exports = {
    // ...
    plugins: [
      // ...
      require('@tailwindcss/forms'),
    ],
  }
  ```
*/

import { Menu, Popover, Transition } from "@headlessui/react";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  FunnelIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  PlusIcon,
  Square3Stack3DIcon,
  Squares2X2Icon,
  TrashIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import { Dispatch, Fragment, SetStateAction, useEffect, useState } from "react";
import { TimeInterval } from "../../../lib/timeCalculations/time";
import { FilterLeaf } from "../../../services/lib/filters/filterDefs";
import { SingleFilterDef } from "../../../services/lib/filters/frontendFilterDefs";
import { clsx } from "../clsx";
import ThemedTimeFilter from "./themedTimeFilter";

import { Column } from "../../ThemedTableV2";
import { AdvancedFilters, UIFilterRow } from "./themedAdvancedFilters";
import ThemedToggle from "./themedTabs";
import { Json } from "../../../supabase/database.types";
import ThemedModal from "./themedModal";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import useNotification from "../notification/useNotification";
import { useLayouts } from "../../../services/hooks/useLayouts";
import Link from "next/link";
import { Result } from "../../../lib/result";
import { ThemedPill } from "./themedPill";
import { ThemedMultiSelect } from "./themedMultiSelect";
import { Toggle } from "./themedToggle";

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
    timeFilterOptions: { key: string; value: string }[];
    customTimeFilter: boolean;
    onTimeSelectHandler: (key: TimeInterval, value: string) => void;
    defaultTimeFilter: TimeInterval;
  };
  advancedFilter?: {
    filterMap: SingleFilterDef<any>[];
    onAdvancedFilter: Dispatch<SetStateAction<UIFilterRow[]>>;
    filters: UIFilterRow[];
    searchPropertyFilters: (
      property: string,
      search: string
    ) => Promise<Result<void, string>>;
  };
  layout?: {
    currentLayout: {
      columns: Json;
      created_at: string | null;
      filters: Json;
      id: number;
      name: string;
      user_id: string;
    } | null;
    setLayout: (name: string) => void;
    onCreateLayout: (layoutName: string) => void;
    layouts:
      | {
          columns: Json;
          created_at: string | null;
          filters: Json;
          id: number;
          name: string;
          user_id: string;
        }[]
      | null
      | undefined;
    clearLayout: () => void;
  };
}

const notificationMethods = [
  { id: "filtered", title: "Only selected columns", filtered: true },
  { id: "all", title: "All event properties", filtered: false },
];

export default function ThemedHeader(props: ThemedHeaderProps) {
  const {
    isFetching,
    editColumns,
    timeFilter,
    advancedFilter,
    layout,
    csvExport,
  } = props;

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [exportFiltered, setExportFiltered] = useState(false);
  const [openLayout, setOpenLayout] = useState(false);
  const [name, setName] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteLayout, setDeleteLayout] = useState<{
    columns: Json;
    created_at: string | null;
    filters: Json;
    id: number;
    name: string;
    user_id: string;
  }>();

  const supabaseClient = useSupabaseClient();
  const { setNotification } = useNotification();
  const { refetch: refetchLayouts } = useLayouts();

  const onDeleteLayoutHandler = async (layoutId: number) => {
    const { error } = await supabaseClient
      .from("layout")
      .delete()
      .eq("id", layoutId);

    if (error) {
      setNotification("Error deleting layout", "error");
      setOpenLayout(false);
      return;
    }
    setOpenLayout(false);
    setNotification("Layout deleted", "success");
    refetchLayouts();
    layout?.clearLayout();
  };

  return (
    <>
      {/* Filters */}
      <div aria-labelledby="filter-heading" className="grid items-center">
        <h2 id="filter-heading" className="sr-only">
          Filters
        </h2>
        <div className="flex flex-col lg:flex-row items-start gap-4 justify-between lg:items-center">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-2 sm:items-center">
            {timeFilter && (
              <ThemedTimeFilter
                timeFilterOptions={timeFilter.timeFilterOptions}
                isFetching={isFetching}
                onSelect={(key, value) =>
                  timeFilter.onTimeSelectHandler(key as TimeInterval, value)
                }
                defaultValue={timeFilter.defaultTimeFilter ?? "all"}
                custom={timeFilter.customTimeFilter}
              />
            )}
          </div>
          <div className="flex flex-wrap space-x-2 items-center">
            {advancedFilter && (
              <div className="mx-auto flex text-sm">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white hover:bg-sky-50 flex flex-row items-center gap-2"
                >
                  <FunnelIcon
                    className="h-5 w-5 text-gray-900"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium text-gray-900 hidden sm:block">
                    {showAdvancedFilters ? "Hide Filters" : "Show Filters"}{" "}
                    {advancedFilter.filters.length > 0 &&
                      `(${advancedFilter.filters.length})`}
                  </p>
                </button>
              </div>
            )}
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
        </div>
        {advancedFilter && (
          <div>
            {advancedFilter.filterMap && (
              <>
                {showAdvancedFilters && (
                  <AdvancedFilters
                    filterMap={advancedFilter.filterMap}
                    filters={advancedFilter.filters}
                    setAdvancedFilters={advancedFilter.onAdvancedFilter}
                    searchPropertyFilters={advancedFilter.searchPropertyFilters}
                  />
                )}
                {advancedFilter.filters.length > 0 && !showAdvancedFilters && (
                  <div className="flex-wrap w-full flex-row space-x-4 space-y-2 mt-4">
                    {advancedFilter.filters.map((_filter, index) => {
                      return (
                        <ThemedPill
                          key={index}
                          label={`${
                            advancedFilter.filterMap[_filter.filterMapIdx]
                              ?.label
                          } ${
                            advancedFilter.filterMap[_filter.filterMapIdx]
                              ?.operators[_filter.operatorIdx].label
                          } ${_filter.value}`}
                          onDelete={() => {
                            advancedFilter.onAdvancedFilter((prev) => {
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
              </>
            )}
          </div>
        )}
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
      {layout && openLayout && (
        <ThemedModal open={openLayout} setOpen={setOpenLayout}>
          <div className="flex flex-col space-y-4 sm:space-y-8 max-w-sm">
            <div className="flex flex-col space-y-2">
              <p className="text-sm sm:text-md font-semibold text-gray-900">
                Create Layout
              </p>
              <p className="text-sm sm:text-md text-gray-500">
                Create layouts to easily switch between different filters,
                column selections, and sort orders.
              </p>
            </div>

            <input
              type="text"
              onChange={(e) => setName(e.target.value)}
              placeholder={"Layout Name..."}
              value={name}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
            />
            <div className="w-full flex justify-end text-sm">
              <button
                className="items-center rounded-md bg-black px-3 py-1.5 text-md flex font-normal text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                onClick={() => {
                  layout.onCreateLayout(name);
                  setOpenLayout(false);
                }}
              >
                <PlusIcon className="h-4 w-4 inline" />
                Add Layout
              </button>
            </div>
          </div>
        </ThemedModal>
      )}
      {layout && openDelete && (
        <ThemedModal open={openDelete} setOpen={setOpenDelete}>
          <div className="flex flex-col space-y-4 sm:space-y-8 min-w-[25rem]">
            <div className="flex flex-col space-y-2">
              <p className="text-sm sm:text-md font-semibold text-gray-900">
                Delete Layout
              </p>
              <p className="text-sm sm:text-md text-gray-500">
                {`Are you sure you want to delete layout: ${deleteLayout?.name}?`}
              </p>
            </div>

            <div className="w-full flex justify-end text-sm space-x-2">
              <button
                type="button"
                onClick={() => setOpenDelete(false)}
                className="flex flex-row items-center rounded-md bg-white px-4 py-2 text-sm font-medium border border-gray-300 hover:bg-gray-50 text-gray-900 shadow-sm hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
              >
                Cancel
              </button>
              <button
                className="flex flex-row items-center rounded-md bg-red-500 px-4 py-2 text-sm font-medium border border-red-500 hover:bg-red-700 text-gray-50 shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                onClick={() => {
                  deleteLayout?.id && onDeleteLayoutHandler(deleteLayout.id);
                  setOpenDelete(false);
                }}
              >
                Delete Layout
              </button>
            </div>
          </div>
        </ThemedModal>
      )}
    </>
  );
}
