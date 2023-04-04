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
  Square3Stack3DIcon,
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
  view?: {
    viewMode: string;
    setViewMode: (mode: "Condensed" | "Expanded") => void;
  };
}

export default function ThemedHeader(props: ThemedHeaderProps) {
  const {
    isFetching,
    editColumns,
    timeFilter,
    advancedFilter,
    csvExport,
    view,
  } = props;
  console.log("LAYOUTS ALL", editColumns, timeFilter, advancedFilter?.filters);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const options = [
    {
      label: "Condensed",
      icon: Square3Stack3DIcon,
    },
    {
      label: "Expanded",
      icon: ArrowsPointingOutIcon,
    },
  ];

  const initialIndex = options.findIndex(
    (option) => option.label === view?.viewMode
  );

  return (
    <div className="">
      {/* Filters */}
      <div aria-labelledby="filter-heading" className="grid items-center">
        <h2 id="filter-heading" className="sr-only">
          Filters
        </h2>
        <div className="flex flex-col md:flex-row items-start gap-4 justify-between md:items-center pb-3">
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
          <div className="flex flex-row space-x-1 items-center">
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

                      <span className="sm:inline md:hidden lg:inline">
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
                  <p className="sm:inline md:hidden lg:inline">
                    {showAdvancedFilters ? "Hide Filters" : "Show Filters"}{" "}
                    {advancedFilter.filters.length > 0 &&
                      `(${advancedFilter.filters.length})`}
                  </p>
                </button>
              </div>
            )}

            {csvExport && (
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
            )}
            {view && (
              <div className="mx-auto flex text-sm">
                <ThemedToggle
                  options={[
                    {
                      label: "Condensed",
                      icon: Square3Stack3DIcon,
                    },
                    {
                      label: "Expanded",
                      icon: ArrowsPointingOutIcon,
                    },
                  ]}
                  onOptionSelect={(option) =>
                    view.setViewMode(option as "Condensed" | "Expanded")
                  }
                  initialIndex={initialIndex}
                />
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
    </div>
  );
}
