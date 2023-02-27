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

import { Disclosure, Menu } from "@headlessui/react";
import {
  ArrowDownTrayIcon,
  FunnelIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useState } from "react";
import { CSVLink } from "react-csv";
import { TimeInterval } from "../../../lib/timeCalculations/time";
import { AdvancedFilterType } from "../../templates/users/usersPage";
import { Column } from "../../ThemedTableV2";
import { clsx } from "../clsx";
import ThemedDropdown from "./themedDropdown";
import ThemedTimeFilter from "./themedTimeFilter";

function escapeCSVString(s: string | undefined): string | undefined {
  if (s === undefined) {
    return undefined;
  }
  return s.replace(/"/g, '""');
}

interface ThemedFilterProps {
  data: any[] | null; // if data is null, then we don't show the export button
  isFetching: boolean; // if fetching, we disable other time select buttons
  onTimeSelectHandler?: (key: TimeInterval, value: string) => void;
  timeFilterOptions?: { key: string; value: string }[]; // if undefined, then we don't show the timeFilter dropdown
  customTimeFilter?: boolean; // if true, then we show the custom time filter
  fileName?: string; // if undefined, then we use the default file name
  columns?: Column[]; // if undefined, don't show the show filters button
  advancedFilter?: AdvancedFilterType[];
  onAdvancedFilter?: (advancedFilters: AdvancedFilterType[]) => void;
}

export default function ThemedFilter(props: ThemedFilterProps) {
  const {
    data,
    onTimeSelectHandler,
    isFetching,
    timeFilterOptions,
    customTimeFilter = false,
    fileName = "export.csv",
    columns,
    advancedFilter,
    onAdvancedFilter,
  } = props;

  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterType[]>(
    advancedFilter || []
  );

  const handleFilterChange = (filter: AdvancedFilterType) => {
    const { idx, type, supabaseKey, value, column, operator } = filter;
    const newFilters = [...advancedFilters];
    newFilters[idx] = { idx, type, supabaseKey, value, column, operator };
    setAdvancedFilters(newFilters);
  };

  console.log(advancedFilters);

  const onDeleteHandler = (idx: number) => {
    const newFilters = [...advancedFilters];
    const filtered = newFilters.filter((filter) => {
      return filter.idx !== idx;
    });
    const remappedFiltered = filtered.map((filter, idx) => {
      filter.idx = idx;
      return filter;
    });
    setAdvancedFilters(remappedFiltered);
  };

  return (
    <div className="">
      {/* Filters */}
      <Disclosure
        as="section"
        aria-labelledby="filter-heading"
        className="grid items-center"
      >
        {({ open }) => (
          <>
            <h2 id="filter-heading" className="sr-only">
              Filters
            </h2>
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-0 justify-between sm:items-center pb-3">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-2 sm:items-center">
                {timeFilterOptions && onTimeSelectHandler && (
                  <ThemedTimeFilter
                    timeFilterOptions={timeFilterOptions}
                    isFetching={isFetching}
                    onSelect={(key, value) =>
                      onTimeSelectHandler(key as TimeInterval, value)
                    }
                    defaultValue="24h"
                    custom={customTimeFilter}
                  />
                )}
              </div>

              {/* TODO: Add back this uncommented code once filters is functional */}

              <div className="flex flex-row space-x-2 items-center pr-2">
                {columns && (
                  <div className="text-sm">
                    <div className="mx-auto flex">
                      <div>
                        <Disclosure.Button
                          className={clsx(
                            open
                              ? "bg-sky-100 text-sky-900"
                              : "hover:bg-sky-100 hover:text-sky-900",
                            "group flex items-center font-medium text-black px-4 py-2 rounded-lg"
                          )}
                        >
                          <FunnelIcon
                            className={clsx(
                              open
                                ? "bg-sky-100 text-sky-900"
                                : "hover:bg-sky-100 hover:text-sky-900",
                              "mr-2 h-5 flex-none"
                            )}
                            aria-hidden="true"
                          />
                          <p className="text-sm">
                            {open ? `Hide Filters` : `Show Filters`}{" "}
                            {advancedFilters.length > 0
                              ? `(${advancedFilters.length})`
                              : ""}
                          </p>
                        </Disclosure.Button>
                      </div>
                    </div>
                  </div>
                )}

                {data !== null && (
                  <div className="pl-0 sm:pl-2">
                    <div className="mx-auto flex">
                      <Menu as="div" className="relative inline-block">
                        <CSVLink
                          data={data.map((d) => ({
                            ...d,
                            request: escapeCSVString(d.request),
                            response: escapeCSVString(d.response),
                          }))}
                          filename={fileName}
                          className="flex"
                          target="_blank"
                        >
                          <button className="group inline-flex items-center justify-center text-sm font-medium text-black hover:bg-sky-100 hover:text-sky-900 px-4 py-2 rounded-lg">
                            <ArrowDownTrayIcon
                              className="mr-2 h-5 flex-none text-black hover:bg-sky-100 hover:text-sky-900"
                              aria-hidden="true"
                            />
                            Export
                          </button>
                        </CSVLink>
                      </Menu>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {columns && onAdvancedFilter && (
              <Disclosure.Panel className="border border-gray-300 border-dashed bg-white rounded-lg p-4 mt-2 mb-4 shadow-sm space-y-4">
                <p className="text-sm text-gray-500">Filters</p>
                <div className="space-y-4 ml-4">
                  {advancedFilters.map((filter) => (
                    <div
                      className="w-full justify-between flex flex-row items-center space-x-4"
                      key={filter.idx}
                    >
                      <div className="w-full">
                        <ThemedDropdown
                          options={columns}
                          idx={filter.idx}
                          onChange={(idx, type, key, value, column, operator) =>
                            handleFilterChange({
                              idx,
                              column,
                              supabaseKey: key,
                              type,
                              value,
                              operator,
                            })
                          }
                          onTypeChange={(idx, column) => {
                            handleFilterChange({
                              idx,
                              type: column.type || "text",
                              supabaseKey: column.key,
                              value: "",
                              column,
                              operator: "eq",
                            });
                          }}
                          onOperatorChange={(idx, operator) => {
                            handleFilterChange({
                              idx,
                              operator,
                              type: filter.type || "text",
                              supabaseKey: filter.supabaseKey,
                              value: filter.value,
                              column: filter.column,
                            });
                          }}
                          onDelete={onDeleteHandler}
                          initialOperator={filter.operator}
                          initialSelected={filter.column}
                          initialValue={filter.value}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setAdvancedFilters([
                      ...advancedFilters,
                      { idx: advancedFilters.length, operator: "eq" },
                    ])
                  }
                  className="ml-4 flex flex-row items-center justify-center font-normal text-sm text-black hover:bg-sky-100 hover:text-sky-900 px-3 py-1.5 rounded-lg"
                >
                  <PlusIcon
                    className="mr-2 h-4 flex-none text-black hover:bg-sky-100 hover:text-sky-900"
                    aria-hidden="true"
                  />
                  Add Filter
                </button>
                <div className="w-full flex justify-end gap-4">
                  <button
                    onClick={() => {
                      onAdvancedFilter([]);
                      setAdvancedFilters([]);
                    }}
                    className={clsx(
                      "relative inline-flex items-center rounded-md hover:bg-gray-50 bg-white px-4 py-2 text-sm font-medium text-gray-700"
                    )}
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => onAdvancedFilter(advancedFilters)}
                    className={clsx(
                      "relative inline-flex items-center rounded-md hover:bg-gray-700 bg-black px-4 py-2 text-sm font-medium text-white"
                    )}
                  >
                    Save
                  </button>
                </div>
              </Disclosure.Panel>
            )}
          </>
        )}
      </Disclosure>
    </div>
  );
}
