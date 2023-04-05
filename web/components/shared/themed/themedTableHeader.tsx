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
import SaveLayoutButton from "./themedSaveLayout";
import ThemedModal from "./themedModal";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import useNotification from "../notification/useNotification";
import { useLayouts } from "../../../services/hooks/useLayouts";

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
    onClick: () => void;
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
  };
}

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
  const [open, setOpen] = useState(false);
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

  const onDeleteHandler = async (layoutId: number) => {
    const { error } = await supabaseClient
      .from("layout")
      .delete()
      .eq("id", layoutId);

    if (error) {
      setNotification("Error deleting layout", "error");
      setOpen(false);
      return;
    }
    setOpen(false);
    setNotification("Layout deleted", "success");
    refetchLayouts();
  };

  return (
    <>
      {/* Filters */}
      <div aria-labelledby="filter-heading" className="grid items-center">
        <h2 id="filter-heading" className="sr-only">
          Filters
        </h2>
        <div className="flex flex-col lg:flex-row items-start gap-4 justify-between lg:items-center pb-3">
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
          <div className="flex flex-wrap space-x-1 items-center">
            {editColumns && (
              <Popover className="relative text-sm">
                {({ open }) => (
                  <>
                    <Popover.Button
                      className={clsx(
                        open
                          ? "bg-sky-100 text-sky-900"
                          : "hover:bg-sky-100 hover:text-sky-900",
                        "group flex items-center font-medium text-black px-4 py-2 rounded-lg"
                      )}
                    >
                      <ViewColumnsIcon
                        className="mr-2 h-5 flex-none text-black hover:bg-sky-100 hover:text-sky-900"
                        aria-hidden="true"
                      />

                      <span className="sm:inline hidden lg:inline">
                        {`Columns (${
                          editColumns.columns.filter((col) => col.active).length
                        } / ${editColumns.columns.length})`}
                      </span>
                    </Popover.Button>

                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 translate-y-1"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-1"
                    >
                      <Popover.Panel className="absolute left-0 z-10 mt-2.5 flex">
                        {({ close }) => (
                          <div className="flex-auto rounded-lg bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5">
                            <div className="grid grid-cols-2 divide-x divide-gray-900/5 bg-gray-50 rounded-t-lg">
                              <button
                                onClick={() => {
                                  const newColumns = [...editColumns.columns];

                                  newColumns.forEach((col) => {
                                    col.active = false;
                                  });

                                  editColumns.onColumnCallback(newColumns);
                                }}
                                className="text-xs flex items-center justify-center gap-x-2.5 p-3 font-semibold text-gray-900 hover:bg-gray-100 rounded-t-lg border-b border-gray-900/5"
                              >
                                <MinusCircleIcon
                                  className="h-4 w-4 flex-none text-gray-400"
                                  aria-hidden="true"
                                />
                                Deselect All
                              </button>
                              <button
                                onClick={() => {
                                  const newColumns = [...editColumns.columns];

                                  newColumns.forEach((col) => {
                                    col.active = true;
                                  });

                                  editColumns.onColumnCallback(newColumns);
                                }}
                                className="text-xs flex items-center justify-center gap-x-2.5 p-3 font-semibold text-gray-900 hover:bg-gray-100 border-b border-gray-900/5"
                              >
                                <PlusCircleIcon
                                  className="h-4 w-4 flex-none text-gray-400"
                                  aria-hidden="true"
                                />
                                Select All
                              </button>
                            </div>
                            <fieldset className="w-[250px] h-[350px] overflow-auto flex-auto bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5 rounded-b-lg">
                              <div className="divide-y divide-gray-200 border-gray-200">
                                {editColumns.columns.map((col, idx) => (
                                  <label
                                    key={idx}
                                    htmlFor={`person-${col.label}`}
                                    className="relative p-4 select-none font-medium text-gray-900 w-full justify-between items-center flex hover:bg-gray-50 hover:cursor-pointer"
                                  >
                                    <span>{col.label}</span>
                                    <input
                                      id={`person-${col.label}`}
                                      name={`person-${col.label}`}
                                      type="checkbox"
                                      checked={col.active}
                                      onChange={(e) => {
                                        const newColumns = [
                                          ...editColumns.columns,
                                        ];
                                        const col = newColumns[idx];
                                        col.active = e.target.checked;

                                        editColumns.onColumnCallback(
                                          newColumns
                                        );
                                      }}
                                      className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-600"
                                    />
                                  </label>
                                ))}
                              </div>
                            </fieldset>
                          </div>
                        )}
                      </Popover.Panel>
                    </Transition>
                  </>
                )}
              </Popover>
            )}
            {advancedFilter && (
              <div className="mx-auto flex text-sm">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="group inline-flex items-center justify-center font-medium text-black hover:bg-sky-100 hover:text-sky-900 px-4 py-2 rounded-lg"
                >
                  <FunnelIcon
                    className="mr-2 h-5 flex-none text-black hover:bg-sky-100 hover:text-sky-900"
                    aria-hidden="true"
                  />
                  <p className="sm:inline hidden lg:inline">
                    {showAdvancedFilters ? "Hide Filters" : "Show Filters"}{" "}
                    {advancedFilter.filters.length > 0 &&
                      `(${advancedFilter.filters.length})`}
                  </p>
                </button>
              </div>
            )}
            {layout && (
              <Popover className="relative text-sm">
                {({ open }) => (
                  <>
                    <Popover.Button
                      className={clsx(
                        open
                          ? "bg-sky-100 text-sky-900"
                          : "hover:bg-sky-100 hover:text-sky-900",
                        "group flex items-center font-medium text-black px-4 py-2 rounded-lg"
                      )}
                    >
                      <Squares2X2Icon
                        className="mr-2 h-5 flex-none text-black hover:bg-sky-100 hover:text-sky-900"
                        aria-hidden="true"
                      />
                      <span className="sm:inline hidden lg:inline">
                        Layouts
                      </span>
                    </Popover.Button>

                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 translate-y-1"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-1"
                    >
                      <Popover.Panel className="absolute right-0 z-10 mt-2.5 flex">
                        {({ close }) => (
                          <div className="flex-auto rounded-lg bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5">
                            <div className="grid grid-cols-1 divide-x divide-gray-900/5 bg-gray-50 rounded-t-lg">
                              <button
                                type="button"
                                onClick={() => setOpen(true)}
                                className="text-xs flex items-center justify-center gap-x-2.5 p-3 font-semibold text-gray-900 hover:bg-gray-100 border-b border-gray-900/5"
                              >
                                <PlusCircleIcon
                                  className="h-4 w-4 flex-none text-gray-400"
                                  aria-hidden="true"
                                />
                                Create Layout
                              </button>
                            </div>
                            <fieldset className="min-w-[250px] w-full overflow-auto flex-auto bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5 rounded-b-lg">
                              <div className="divide-y divide-gray-200 border-gray-200">
                                {layout.layouts!.map((l, idx) => (
                                  <div
                                    className="flex flex-row justify-between items-center"
                                    key={idx}
                                  >
                                    <button
                                      className={clsx(
                                        l.id === layout.currentLayout?.id
                                          ? "bg-sky-100 text-sky-900"
                                          : "text-gray-900 hover:bg-gray-50",
                                        "relative p-4 select-none font-medium w-full justify-between items-center flex hover:cursor-pointer"
                                      )}
                                      onClick={() => {
                                        layout.setLayout(l.name);
                                      }}
                                    >
                                      <span>{l.name}</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="absolute right-3 inline-flex items-center rounded-md bg-red-500 p-1 text-sm font-medium leading-4 text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
                                      onClick={() => {
                                        setDeleteLayout(l);
                                        setOpenDelete(true);
                                      }}
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </fieldset>
                          </div>
                        )}
                      </Popover.Panel>
                    </Transition>
                  </>
                )}
              </Popover>
            )}

            {/* {csvExport && (
              <div className="mx-auto flex text-sm">
                <Menu as="div" className="relative inline-block">
                  <button
                    onClick={csvExport.onClick}
                    className="group inline-flex items-center justify-center font-medium text-black hover:bg-sky-100 hover:text-sky-900 px-4 py-2 rounded-lg"
                  >
                    <ArrowDownTrayIcon
                      className="mr-2 h-5 flex-none text-black hover:bg-sky-100 hover:text-sky-900"
                      aria-hidden="true"
                    />
                    <p className="sm:inline md:hidden lg:inline">Export</p>
                  </button>
                </Menu>
              </div>
            )} */}
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
                  />
                )}
                {advancedFilter.filters.length > 0 && !showAdvancedFilters && (
                  <div className="flex-wrap w-full flex-row space-x-4 space-y-2 mt-4">
                    {advancedFilter.filters.map((_filter, index) => {
                      return (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-2xl bg-sky-100 py-1.5 pl-4 pr-2 text-sm font-medium text-sky-700 border border-sky-300"
                        >
                          {
                            advancedFilter.filterMap[_filter.filterMapIdx]
                              ?.label
                          }{" "}
                          {
                            advancedFilter.filterMap[_filter.filterMapIdx]
                              ?.operators[_filter.operatorIdx].label
                          }{" "}
                          {_filter.value}
                          <button
                            onClick={() => {
                              advancedFilter.onAdvancedFilter((prev) => {
                                const newFilters = [...prev];
                                newFilters.splice(index, 1);
                                return newFilters;
                              });
                            }}
                            type="button"
                            className="ml-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-sky-400 hover:bg-indigo-200 hover:text-sky-500 focus:bg-sky-500 focus:text-white focus:outline-none"
                          >
                            <span className="sr-only">Remove large option</span>
                            <svg
                              className="h-2.5 w-2.5"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 8 8"
                            >
                              <path
                                strokeLinecap="round"
                                strokeWidth="1.5"
                                d="M1 1l6 6m0-6L1 7"
                              />
                            </svg>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {layout && open && (
        <ThemedModal open={open} setOpen={setOpen}>
          <div className="flex flex-col space-y-4 sm:space-y-8 min-w-[25rem]">
            <div className="flex flex-col space-y-2">
              <p className="text-sm sm:text-md font-semibold text-gray-900">
                Save Layout
              </p>
              <p className="text-sm sm:text-md text-gray-500">
                Save your current layout to be used later.
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
                  setOpen(false);
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
                onClick={() =>
                  deleteLayout?.id && onDeleteHandler(deleteLayout.id)
                }
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
